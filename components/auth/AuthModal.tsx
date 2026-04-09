"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Schemas                                                             */
/* ------------------------------------------------------------------ */

const signInSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotSchema = z.object({
  email: z.email("Please enter a valid email"),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "sign-in" | "sign-up";
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type Mode = "auth" | "verify-otp" | "forgot-password";

export function AuthModal({ open, onOpenChange, defaultTab = "sign-in" }: AuthModalProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];
  const [tab, setTab] = useState(defaultTab);
  const [mode, setMode] = useState<Mode>("auth");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpType, setOtpType] = useState<"signup" | "recovery">("signup");

  /* ---- Forms ---- */

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  /* ---- Helpers ---- */

  function reset() {
    setMode("auth");
    setError(null);
    setInfo(null);
    setOtp("");
    setPendingEmail("");
    signInForm.reset();
    signUpForm.reset();
    forgotForm.reset();
  }

  function handleTabChange(value: string) {
    setTab(value as "sign-in" | "sign-up");
    setError(null);
    setInfo(null);
    signInForm.reset();
    signUpForm.reset();
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  /* ---- Sign in ---- */

  async function handleSignIn(values: SignInValues) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          // Auto-resend OTP and redirect to verify screen
          setPendingEmail(values.email);
          setOtpType("signup");
          const { error: resendErr } = await supabase.auth.resend({
            type: "signup",
            email: values.email,
          });
          if (!resendErr) {
            setInfo("A new verification code has been sent to your email.");
          }
          setMode("verify-otp");
        } else if (msg.includes("invalid login credentials")) {
          setError("Incorrect email or password. If you signed up with Google, use the button below.");
        } else {
          setError(error.message);
        }
        return;
      }
      handleOpenChange(false);
      router.push("/workspace");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  /* ---- Sign up → OTP ---- */

  async function handleSignUp(values: SignUpValues) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // Supabase anti-enumeration: duplicate confirmed email returns user with empty identities
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Please sign in instead.");
        return;
      }
      setPendingEmail(values.email);
      setOtpType("signup");
      setMode("verify-otp");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Verify OTP ---- */

  async function handleVerifyOtp() {
    if (otp.length < 6) {
      setError("Please enter the verification code from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: otpType,
      });
      if (error) {
        setError("Invalid or expired code. Please try again.");
        return;
      }
      if (otpType === "recovery") {
        handleOpenChange(false);
        router.push("/auth/reset-password");
      } else {
        handleOpenChange(false);
        router.push("/workspace");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      let resendError;
      if (otpType === "recovery") {
        ({ error: resendError } = await supabase.auth.resetPasswordForEmail(pendingEmail));
      } else {
        ({ error: resendError } = await supabase.auth.resend({ type: "signup", email: pendingEmail }));
      }
      if (resendError) {
        setError(resendError.message);
      } else {
        setInfo("A new code has been sent to your email.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ---- Forgot password ---- */

  async function handleForgotPassword(values: ForgotValues) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      // resetPasswordForEmail sends an OTP when the email template uses {{ .Token }}
      const { error } = await supabase.auth.resetPasswordForEmail(values.email);
      if (error) {
        setError(error.message);
        return;
      }
      setPendingEmail(values.email);
      setOtpType("recovery");
      setMode("verify-otp");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Google OAuth ---- */

  async function handleGoogleOAuth() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch {
      setError("Failed to connect to Google");
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render helpers                                                      */
  /* ------------------------------------------------------------------ */

  const errorBanner = error && (
    <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  );

  const infoBanner = info && (
    <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {info}
    </p>
  );

  /* ------------------------------------------------------------------ */
  /*  OTP verification view                                              */
  /* ------------------------------------------------------------------ */

  if (mode === "verify-otp") {
    const isRecovery = otpType === "recovery";
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              {isRecovery ? "Reset your password" : "Verify your email"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
              <p>
                {isRecovery
                  ? "We sent a verification code to"
                  : "We sent a verification code to"}{" "}
                <span className="font-medium text-foreground">{pendingEmail}</span>.{" "}
                {isRecovery
                  ? "Enter it below to reset your password."
                  : "Enter it below to confirm your account."}
              </p>
              <p className="text-xs">
                Can&apos;t find it? Check your <span className="font-medium">spam or junk</span> folder.
              </p>
            </div>

            {errorBanner}
            {infoBanner}

            <div className="flex flex-col gap-2">
              <Label htmlFor="otp-input">Verification code</Label>
              <Input
                id="otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="12345678"
                className="text-center text-lg tracking-widest"
                maxLength={8}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtp(); }}
              />
            </div>

            <Button className="cursor-pointer" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
              {loading ? "Verifying..." : isRecovery ? "Continue" : "Verify Email"}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                className="cursor-pointer hover:text-foreground"
                onClick={() => {
                  if (isRecovery) {
                    setMode("forgot-password");
                    setOtp("");
                    setError(null);
                    setInfo(null);
                  } else {
                    reset();
                    setTab("sign-up");
                  }
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                className="cursor-pointer hover:text-foreground disabled:opacity-50"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend code
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Forgot password view                                               */
  /* ------------------------------------------------------------------ */

  if (mode === "forgot-password") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              Reset password
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a verification code to reset your password.
            </p>

            {errorBanner}

            <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  autoFocus
                  {...forgotForm.register("email")}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="cursor-pointer" disabled={loading}>
                {loading ? "Sending..." : "Send reset code"}
              </Button>
            </form>

            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setMode("auth"); setError(null); setInfo(null); forgotForm.reset(); }}
            >
              <ArrowLeft className="size-3" />
              Back to sign in
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main auth view (sign-in / sign-up tabs)                           */
  /* ------------------------------------------------------------------ */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to Easy<span className="text-primary">CV</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in" className="cursor-pointer">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up" className="cursor-pointer">Sign Up</TabsTrigger>
          </TabsList>

          {errorBanner}

          {/* ---- Sign in ---- */}
          <TabsContent value="sign-in" className="mt-4">
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sign-in-email">Email</Label>
                <Input
                  id="sign-in-email"
                  type="email"
                  placeholder="you@example.com"
                  {...signInForm.register("email")}
                />
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sign-in-password">Password</Label>
                  <button
                    type="button"
                    className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setMode("forgot-password"); setError(null); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="sign-in-password"
                  type="password"
                  placeholder="Enter your password"
                  {...signInForm.register("password")}
                />
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="cursor-pointer" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          {/* ---- Sign up ---- */}
          <TabsContent value="sign-up" className="mt-4">
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sign-up-email">Email</Label>
                <Input
                  id="sign-up-email"
                  type="email"
                  placeholder="you@example.com"
                  {...signUpForm.register("email")}
                />
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sign-up-password">Password</Label>
                <Input
                  id="sign-up-password"
                  type="password"
                  placeholder="Min 6 chars, letters + numbers"
                  {...signUpForm.register("password")}
                />
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sign-up-confirm">Confirm Password</Label>
                <Input
                  id="sign-up-confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  {...signUpForm.register("confirmPassword")}
                />
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="cursor-pointer" disabled={loading}>
                {loading ? tr.creatingAccount : tr.authSignUp}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {lang === "zh" ? (
                  <>注册即表示您同意我们的<a href="/terms" className="underline underline-offset-2 hover:text-foreground">{tr.termsOfService}</a>和<a href="/privacy" className="underline underline-offset-2 hover:text-foreground">{tr.privacyPolicy}</a>。</>
                ) : (
                  <>By signing up, you agree to our <a href="/terms" className="underline underline-offset-2 hover:text-foreground">{tr.termsOfService}</a> and <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">{tr.privacyPolicy}</a>.</>
                )}
              </p>
            </form>
          </TabsContent>

          {/* ---- Google OAuth (shared) ---- */}
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={handleGoogleOAuth}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
