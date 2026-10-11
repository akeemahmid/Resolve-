"use client";

import { Button } from "@/components/Button";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ResolveBrand } from "@/components/ResolveBrand";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <main className="signin-page min-h-svh grid place-items-center px-5 py-7.5">
      <div>
        <section
          className="
          signin-card panel bg-surface rounded-[7px] overflow-hidden w-[min(100%,_430px)] p-6.5 border
          border-border border-solid room:p-9 [&_.brand]:mb-9 [&_h1]:text-[30px]
        "
        >
          <ResolveBrand />
          <p className="eyebrow text-[10px] font-semibold tracking-[1.4px] text-muted mb-2.5">
            INSPECTION REMEDIATION
          </p>
          <h1>
            {flow === "signIn"
              ? "Back to resolution."
              : "Your control room starts here."}
          </h1>
          <p className="subheading text-muted mt-3 leading-[1.6]">
            {flow === "signIn"
              ? "Sign in to move your remediations forward."
              : "Create an account to turn findings into verified outcomes."}
          </p>
          <form
            className="
              signin-form grid mt-7 gap-4.5 [&_label]:grid [&_label]:text-[12px] [&_label]:font-[550]
              [&_label]:gap-2 [&_input]:w-full [&_input]:rounded-[5px] [&_input]:bg-surface [&_input]:p-3
              [&_input]:border [&_input]:border-border [&_input]:border-solid
              [&_input:focus]:[outline-color:var(--color-accent)] [&_small]:text-muted [&_small]:text-[10px]
              [&_small]:font-normal
            "
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              const formData = new FormData(event.currentTarget);
              formData.set("flow", flow);
              try {
                await signIn("password", formData);
                router.push("/app");
              } catch {
                setError(
                  flow === "signIn"
                    ? "Could not sign in. Check your email and password and try again."
                    : "Could not create an account. Try signing in if you already have one.",
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                disabled={loading}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={
                  flow === "signUp" ? "new-password" : "current-password"
                }
                minLength={8}
                aria-describedby={
                  flow === "signUp" ? "password-help" : undefined
                }
                required
                disabled={loading}
              />
            </label>
            {flow === "signUp" && (
              <small id="password-help">Use at least 8 characters.</small>
            )}
            {error && (
              <p
                className="
                error-banner bg-danger-soft text-danger-ink rounded-[5px] leading-[1.6] text-[13px] mx-0 my-4
                p-3.5 border border-danger-border border-solid
              "
                role="alert"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading
                ? "Please wait…"
                : flow === "signIn"
                  ? "Sign in →"
                  : "Create account →"}
            </Button>
          </form>
          <p className="signin-switch mt-5.5 flex justify-center items-center text-[12px] text-muted gap-[7px]">
            {flow === "signIn" ? "New to Resolve?" : "Already have an account?"}
            <button
              type="button"
              className="text-button text-foreground underline underline-offset-[3px] bg-transparent border-0 border-solid"
              disabled={loading}
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
                setError(null);
              }}
            >
              {flow === "signIn" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>
        <p className="signin-principle text-center text-[11px] text-muted mt-7.5">
          Resolved means proven, not reported.
        </p>
      </div>
    </main>
  );
}
