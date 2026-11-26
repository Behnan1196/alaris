// RLS ve RPC testleri. Docker gerektirmez: PGlite (WASM Postgres) üzerinde
// Supabase'in auth şemasını taklit eder, migration'ları ve seed'i çalıştırır.
// Çalıştırma: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const supabaseDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();

// --- Supabase taklidi ---------------------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;
`);

const migrations = readdirSync(resolve(supabaseDir, "migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();
for (const f of migrations) {
  await db.exec(readFileSync(resolve(supabaseDir, "migrations", f), "utf8"));
}
await db.exec(readFileSync(resolve(supabaseDir, "seed.sql"), "utf8"));

// --- Yardımcılar --------------------------------------------------------------
async function createUser(name) {
  const { rows } = await db.query(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [`${name.toLowerCase()}@test.local`, { full_name: name }],
  );
  return rows[0].id;
}

/** sql'i verilen kullanıcı olarak (authenticated rolüyle) çalıştırır. uid null ise anon. */
async function as(uid, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query(`set local role ${uid ? "authenticated" : "anon"}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? ""]);
    return (await tx.query(sql, params)).rows;
  });
}

async function rejects(promise, pattern) {
  await assert.rejects(promise, pattern);
}

const deniz = await createUser("Deniz");
const zehra = await createUser("Zehra");
const can = await createUser("Can");
const burak = await createUser("Burak");

let canDenizCoaching, canZehraCoaching, fitnessProgram, workoutTask, workoutInstance;

// --- Testler ------------------------------------------------------------------
test("yeni kullanıcı için profil oluşur", async () => {
  const rows = await as(can, `select full_name from profiles where id = $1`, [can]);
  assert.equal(rows[0].full_name, "Can");
});

test("anon sabit tabloları okur, kişisel veriyi okuyamaz", async () => {
  const domains = await as(null, `select key from domains`);
  assert.equal(domains.length, 4);
  await rejects(as(null, `select * from profiles`), /permission denied/);
});

test("koç profili ve alanları", async () => {
  await as(deniz, `insert into coach_profiles (user_id) values ($1)`, [deniz]);
  await as(deniz, `insert into coach_domains values ($1, 'fitness'), ($1, 'nutrition')`, [deniz]);
  await as(zehra, `insert into coach_profiles (user_id, title) values ($1, 'Dyt.')`, [zehra]);
  await as(zehra, `insert into coach_domains values ($1, 'nutrition')`, [zehra]);
  // Başkası adına koç profili açılamaz
  await rejects(as(burak, `insert into coach_profiles (user_id) values ($1)`, [can]), /row-level security/);
});

test("davet: yalnız kendi alanları, önizleme, kullanma", async () => {
  await rejects(as(deniz, `select create_invite(array['exam'])`), /kendi alanlarını/);
  await rejects(as(can, `select create_invite(array['fitness'])`), /Yalnızca koçlar/);

  const [{ create_invite: code }] = await as(deniz, `select create_invite(array['fitness','nutrition'])`);
  assert.match(code, /^[A-Z2-9]{8}$/);

  const preview = await as(can, `select * from invite_preview($1)`, [code.toLowerCase()]);
  assert.equal(preview[0].coach_name, "Deniz");
  assert.deepEqual(preview[0].domain_keys, ["fitness", "nutrition"]);

  // Danışan davet tablosunu doğrudan okuyamaz
  assert.equal((await as(can, `select * from invites`)).length, 0);

  const [{ redeem_invite }] = await as(can, `select redeem_invite($1, 'v1')`, [code]);
  canDenizCoaching = redeem_invite;
  await rejects(as(burak, `select redeem_invite($1, 'v1')`, [code]), /geçersiz/);

  const domains = await as(can, `select domain_key from coaching_domains where coaching_id = $1 order by 1`, [canDenizCoaching]);
  assert.deepEqual(domains.map((d) => d.domain_key), ["fitness", "nutrition"]);
  assert.equal((await as(can, `select * from threads`)).length, 1);
  assert.equal((await as(can, `select * from consents where type = 'share_with_coach'`)).length, 1);

  const [{ create_invite: code2 }] = await as(zehra, `select create_invite(array['nutrition'])`);
  canZehraCoaching = (await as(can, `select redeem_invite($1, 'v1') as id`, [code2]))[0].id;
});

test("ilgisiz kullanıcı hiçbir şey göremez", async () => {
  assert.equal((await as(burak, `select * from profiles where id = $1`, [can])).length, 0);
  assert.equal((await as(burak, `select * from coachings`)).length, 0);
  assert.equal((await as(burak, `select * from client_other_domains($1)`, [can])).length, 0);
});

test("koç notu danışana görünmez", async () => {
  await as(deniz, `insert into coaching_notes (coaching_id, body) values ($1, 'Diz sakatlığı geçmişi')`, [canDenizCoaching]);
  assert.equal((await as(can, `select * from coaching_notes`)).length, 0);
  assert.equal((await as(zehra, `select * from coaching_notes`)).length, 0);
  assert.equal((await as(deniz, `select * from coaching_notes`)).length, 1);
});

test("program alan başına ve görev tipi alana uygun olmalı", async () => {
  [{ id: fitnessProgram }] = await as(
    deniz,
    `insert into programs (coach_id, coaching_id, domain_key, name, weeks, start_date, status)
     values ($1, $2, 'fitness', 'Güç programı', 12, current_date, 'active') returning id`,
    [deniz, canDenizCoaching],
  );
  [{ id: workoutTask }] = await as(
    deniz,
    `insert into program_tasks (program_id, day_of_week, task_type_key, title, payload)
     values ($1, 1, 'workout', 'Alt vücut', '{"exercises":[]}') returning id`,
    [fitnessProgram],
  );
  await rejects(
    as(deniz, `insert into program_tasks (program_id, day_of_week, task_type_key, title) values ($1, 2, 'meal', 'x')`, [fitnessProgram]),
    /bu alanda kullanılamaz/,
  );
  // Zehra, Can'ın Deniz koçluğuna program yazamaz
  await rejects(
    as(zehra, `insert into programs (coach_id, coaching_id, domain_key, name) values ($1, $2, 'nutrition', 'x')`, [zehra, canDenizCoaching]),
    /verilmemiş/,
  );
  // Taslak program danışana görünmez
  await as(
    deniz,
    `insert into programs (coach_id, coaching_id, domain_key, name, status) values ($1, $2, 'nutrition', 'Taslak plan', 'draft')`,
    [deniz, canDenizCoaching],
  );
  const visible = await as(can, `select name from programs order by name`);
  assert.deepEqual(visible.map((p) => p.name), ["Güç programı"]);
});

test("danışan görevi başlatır; anlık görüntü sunucuda dolar", async () => {
  [{ id: workoutInstance }] = await as(
    can,
    `insert into task_instances (program_task_id, date, status, title, client_id, coaching_id, domain_key, task_type_key)
     values ($1, current_date, 'in_progress', 'sahte başlık', $2, $3, 'nutrition', 'meal') returning id`,
    [workoutTask, burak, canZehraCoaching],
  );
  const [row] = await as(can, `select * from task_instances where id = $1`, [workoutInstance]);
  assert.equal(row.title, "Alt vücut");
  assert.equal(row.client_id, can);
  assert.equal(row.domain_key, "fitness");
  await as(can, `insert into task_logs (task_instance_id, kind, data) values ($1, 'set', '{"kg":60,"reps":8}')`, [workoutInstance]);
  // Başkası Can'ın görevini oluşturamaz
  await rejects(
    as(burak, `insert into task_instances (program_task_id, date) values ($1, current_date + 1)`, [workoutTask]),
    /row-level security/,
  );
  assert.equal((await as(deniz, `select * from task_logs`)).length, 1);
});

test("koçlar arası görünürlük yalnız rızayla", async () => {
  assert.equal((await as(zehra, `select * from programs where id = $1`, [fitnessProgram])).length, 0);
  assert.equal((await as(zehra, `select * from task_instances`)).length, 0);
  assert.equal((await as(zehra, `select * from task_logs`)).length, 0);

  const [{ id: consentId }] = await as(
    can,
    `insert into consents (client_id, type, grantee_coach_id, source_coaching_id, text_version)
     values ($1, 'cross_coach_share', $2, $3, 'v1') returning id`,
    [can, zehra, canDenizCoaching],
  );
  assert.equal((await as(zehra, `select * from programs where id = $1`, [fitnessProgram])).length, 1);
  assert.equal((await as(zehra, `select * from task_instances`)).length, 1);
  assert.equal((await as(zehra, `select * from task_logs`)).length, 1);
  // Rıza Zehra'ya Deniz'in taslaklarını açmaz
  assert.equal((await as(zehra, `select * from programs where status = 'draft'`)).length, 0);

  await as(can, `update consents set revoked_at = now() where id = $1`, [consentId]);
  assert.equal((await as(zehra, `select * from programs where id = $1`, [fitnessProgram])).length, 0);
});

test("başka koçlardan aldığı: yalnız alan adları", async () => {
  const forDeniz = await as(deniz, `select domain_key from client_other_domains($1)`, [can]);
  assert.deepEqual(forDeniz.map((r) => r.domain_key), ["nutrition"]);
  const forZehra = await as(zehra, `select domain_key from client_other_domains($1) order by 1`, [can]);
  assert.deepEqual(forZehra.map((r) => r.domain_key), ["fitness", "nutrition"]);
});

test("alışkanlıklar: koçun atadığı, danışanın kendisininki ve görünürlük", async () => {
  await as(deniz, `insert into habits (client_id, coaching_id, domain_key, title, target, unit) values ($1, $2, 'nutrition', 'Su', 8, 'bardak')`, [can, canDenizCoaching]);
  // Koç, danışanı olmayan birine alışkanlık atayamaz
  await rejects(
    as(deniz, `insert into habits (client_id, coaching_id, title) values ($1, $2, 'x')`, [burak, canDenizCoaching]),
    /row-level security/,
  );
  await as(can, `insert into habits (client_id, title) values ($1, 'Kitap oku')`, [can]);
  const [{ id: visibleOwn }] = await as(
    can,
    `insert into habits (client_id, title, visible_to_coaches) values ($1, '10.000 adım', true) returning id`,
    [can],
  );

  const denizSees = (await as(deniz, `select title from habits order by title`)).map((h) => h.title);
  assert.deepEqual(denizSees, ["10.000 adım", "Su"]);
  const zehraSees = (await as(zehra, `select title from habits order by title`)).map((h) => h.title);
  assert.deepEqual(zehraSees, ["10.000 adım"]);

  await as(can, `insert into habit_logs (habit_id, date, value) values ($1, current_date, 1)`, [visibleOwn]);
  await rejects(
    as(deniz, `insert into habit_logs (habit_id, date, value) values ($1, current_date - 1, 1)`, [visibleOwn]),
    /row-level security/,
  );
  // Danışan koçun atadığı alışkanlığı silemez
  const deleted = await as(can, `delete from habits where coaching_id is not null returning id`);
  assert.equal(deleted.length, 0);
});

test("ölçümler: koç yalnız kendi koçluğundakini görür", async () => {
  await as(can, `insert into measurements (client_id, coaching_id, metric, value) values ($1, $2, 'weight', 78.4)`, [can, canDenizCoaching]);
  await as(can, `insert into measurements (client_id, metric, value) values ($1, 'waist', 84)`, [can]);
  assert.equal((await as(deniz, `select * from measurements`)).length, 1);
  assert.equal((await as(zehra, `select * from measurements`)).length, 0);
  assert.equal((await as(can, `select * from measurements`)).length, 2);
  // Danışan başkasının koçluğuna ölçüm bağlayamaz
  await rejects(
    as(burak, `insert into measurements (client_id, coaching_id, metric, value) values ($1, $2, 'weight', 70)`, [burak, canDenizCoaching]),
    /row-level security/,
  );
});

test("mesajlar: yalnız sohbetin tarafları", async () => {
  const [{ id: threadId }] = await as(can, `select id from threads where coach_id = $1`, [deniz]);
  await as(can, `insert into messages (thread_id, sender_id, body) values ($1, $2, 'Merhaba hocam')`, [threadId, can]);
  await rejects(
    as(can, `insert into messages (thread_id, sender_id, body) values ($1, $2, 'sahte')`, [threadId, deniz]),
    /row-level security/,
  );
  await rejects(
    as(zehra, `insert into messages (thread_id, sender_id, body) values ($1, $2, 'x')`, [threadId, zehra]),
    /row-level security/,
  );
  assert.equal((await as(deniz, `select * from messages`)).length, 1);
  assert.equal((await as(zehra, `select * from messages`)).length, 0);
  const updated = await as(deniz, `update messages set read_at = now() returning id`);
  assert.equal(updated.length, 1);
  const own = await as(can, `update messages set body = 'değişti' returning id`);
  assert.equal(own.length, 0);
});

test("kütüphane: sistem + kendi + koçunun", async () => {
  await as(deniz, `insert into exercises (owner_coach_id, name) values ($1, 'Deniz özel hareket')`, [deniz]);
  const canSees = await as(can, `select name from exercises where owner_coach_id is not null`);
  assert.deepEqual(canSees.map((e) => e.name), ["Deniz özel hareket"]);
  assert.equal((await as(zehra, `select * from exercises where owner_coach_id is not null`)).length, 0);
  assert.equal((await as(burak, `select * from exercises`)).length, 4);
});

test("bütünlük: değişmemesi gereken sütunlar korunur", async () => {
  await rejects(
    as(deniz, `update coachings set client_id = $1 where id = $2`, [burak, canDenizCoaching]),
    /taraflar/,
  );
  await rejects(
    as(can, `update task_instances set coaching_id = $1 where id = $2`, [canZehraCoaching, workoutInstance]),
    /yalnızca durumu/,
  );
  const done = await as(can, `update task_instances set status = 'done', completed_at = now() where id = $1 returning status`, [workoutInstance]);
  assert.equal(done[0].status, "done");
  await rejects(as(deniz, `update messages set body = 'değiştirildi'`), /okundu/);
  await rejects(as(can, `update consents set grantee_coach_id = $1 where type = 'share_with_coach'`, [burak]), /değiştirilemez/);
  await rejects(as(can, `update consents set revoked_at = now() where type = 'cross_coach_share'`), /değiştirilemez/);
});

test("danışan koçun alışkanlığında hedefi yalnız izinle değiştirir", async () => {
  const [{ id: water }] = await as(can, `select id from habits where title = 'Su'`);
  await rejects(as(can, `select set_habit_target($1, 10)`, [water]), /değiştirilemez/);
  await as(deniz, `update habits set client_can_edit_target = true where id = $1`, [water]);
  await as(can, `select set_habit_target($1, 10)`, [water]);
  const [{ target }] = await as(deniz, `select target from habits where id = $1`, [water]);
  assert.equal(Number(target), 10);
  // Doğrudan güncelleme yine engelli
  const direct = await as(can, `update habits set title = 'x' where id = $1 returning id`, [water]);
  assert.equal(direct.length, 0);
});
