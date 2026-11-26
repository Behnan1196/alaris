# 6. Veri modeli (taslak)

Bu bir **taslaktır** [VARSAYIM]. Supabase (Postgres) şemasına dönüştürülecek; erişim kuralları Row Level Security ile uygulanacak. İsimler İngilizce, açıklamalar Türkçe.

## Ana varlıklar

```
User                 id, email, phone?, name, locale, created_at
  ├─ ClientProfile   user_id, birth_date?, goals?, ... (danışan)
  └─ CoachProfile    user_id, bio, photo, title (ör. "Dyt."), subscription_id

Domain               key (fitness|nutrition|exam|guitar), name, color, image, enabled
TaskType             key (workout|meal|measure|habit|study|exam|lesson|guitar), schema (tipe özel alanlar)
DomainTaskType       domain_key, task_type_key      -- hangi alan hangi tipi kullanır

CoachDomain          coach_id, domain_key           -- koçun hizmet verdiği alanlar

Coaching             id, coach_id, client_id, status (invited|active|paused|ended),
                     started_at, ended_at, private_note   -- koç ile danışan arasındaki ilişki
CoachingDomain       coaching_id, domain_key        -- bu danışana verilen alanlar (koçun alanlarının alt kümesi)

Invite               code, coach_id, domain_keys[], expires_at, used_by, used_at

Program              id, coaching_id, domain_key?, name, weeks, start_date,
                     repeat (once|4_weeks|until_end), status, is_template, coach_id
ProgramTask          id, program_id, week_no, day_of_week, domain_key, task_type_key,
                     title, payload (JSON: tipe özel alanlar), options (JSON), client_note, order
ProgramHabit         id, program_id, domain_key, title, frequency, target, reminder, options

TaskInstance         id, program_task_id, client_id, date, status (pending|done|missed|skipped),
                     started_at, completed_at, progress (JSON: kaldığı yer)
TaskLog              id, task_instance_id, kind, data (JSON)  -- set kaydı, öğün işareti, net, ses kaydı...

Habit                id, owner (coach|client), coaching_id?, client_id, title, frequency, target,
                     reminder, visible_to_coaches (bool)
HabitLog             habit_id, date, value (sayaç veya 1), 

Measurement          id, client_id, coaching_id?, date, metric (weight|waist|hip|body_fat), value, photo_ids[]

Exercise             id, owner_coach_id? (null = sistem kütüphanesi), name, muscles[], equipment,
                     steps[], video_urls (açılara göre)
Food / MealTemplate  id, owner_coach_id?, name, kcal, protein, carb, fat, portions

Thread               id, coach_id, client_id        -- koç başına bir sohbet [KARAR]
Message              id, thread_id, sender_id, body, attachments[], related_task_instance_id?, read_at

Consent              id, client_id, type (kvkk|health_data|share_with_coach|marketing),
                     scope (ör. coaching_id veya coach_id), granted_at, revoked_at, version
Subscription         id, coach_id, plan (monthly|yearly), status, current_period_end, provider_ref
Media                id, owner_id, kind (image|video|audio), url, created_at
```

## Önemli kurallar

- `CoachingDomain` alanları, ilgili koçun `CoachDomain` alanlarının alt kümesi olmalı.
- Danışan uygulamasında **widget = (Coaching, Domain) çifti**. Can'ın Deniz ile Fitness ve Beslenme'si iki widget, tek `Thread`.
- Bir koç başka koçların verisini yalnızca `Consent(type=share_with_coach)` geçerliyse görür. Rıza olmadan görebildiği tek şey: danışanın başka hangi **alanlarda** koçluk aldığı (mockup'taki "Başka koçlardan aldığı" kartı). Bunun bile rızaya bağlı olması gerekip gerekmediği açık. [AÇIK SORU]
- Program değişince geçmiş `TaskInstance` ve `TaskLog` kayıtları korunur (geçmiş yeniden yazılmaz).
- Görev tiplerinin alanları `TaskType.schema` ile tanımlanır; yeni alan eklemek veri tabanı değişikliği gerektirmemeli.
- Sağlık verileri (kilo, ölçü, öğün fotoğrafı) KVKK'da özel nitelikli kişisel veri sayılabilir; ayrı korunur (bkz. `08-gizlilik-kvkk.md`).
