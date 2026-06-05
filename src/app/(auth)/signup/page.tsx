"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (!canUseSupabaseAuth()) {
        router.push("/dashboard/onboarding");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim() || undefined
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        router.push("/dashboard/onboarding");
        router.refresh();
        return;
      }

      setSuccessMessage("Account created. Check your email to confirm your signup, then log in.");
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-md p-6">
        <BrandMark />
        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {canUseSupabaseAuth()
              ? "Create a Supabase Auth account for API-backed projects."
              : "Supabase Auth is not configured in this environment. Continue with local/dev project setup."}
          </p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSignup}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" onChange={(event) => setName(event.target.value)} placeholder="Your name" value={name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          {successMessage ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {successMessage}
            </p>
          ) : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Creating account" : canUseSupabaseAuth() ? "Create account" : "Create local workspace"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have access?{" "}
          <Link className="font-semibold text-primary" href="/login">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}

function canUseSupabaseAuth() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
