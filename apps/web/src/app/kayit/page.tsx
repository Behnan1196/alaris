import { T } from "@/components/t";
import { AuthCard } from "@/components/ui";
import { SignupForm } from "./signup-form";

export default function Page() {
  return (
    <AuthCard title={<T k="web.auth.signUpAsCoach" />}>
      <SignupForm />
    </AuthCard>
  );
}
