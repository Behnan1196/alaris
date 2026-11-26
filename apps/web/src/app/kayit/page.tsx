import { AuthCard } from "@/components/ui";
import { SignupForm } from "./signup-form";

export default function Page() {
  return (
    <AuthCard title="Koç olarak kaydol">
      <SignupForm />
    </AuthCard>
  );
}
