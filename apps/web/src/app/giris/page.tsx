import { Suspense } from "react";
import { T } from "@/components/t";
import { AuthCard } from "@/components/ui";
import { LoginForm } from "./login-form";

async function Form({ searchParams }: { searchParams: PageProps<"/giris">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  return <LoginForm next={next} confirmed={params.onay === "1"} />;
}

export default function Page({ searchParams }: PageProps<"/giris">) {
  return (
    <AuthCard title={<T k="auth.signIn" />}>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
