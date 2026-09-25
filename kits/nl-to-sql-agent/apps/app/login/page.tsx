import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSession } from "@/lib/session";
import LoginForm from "@/app/login/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}