"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useUILanguage } from "@/lib/ui-language";
import { t } from "@/lib/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Schemas                                                             */
/* ------------------------------------------------------------------ */

function makeSchemas(tr: typeof t.en | typeof t.zh) {
  const displayNameSchema = z.object({
    displayName: z.string().trim().min(1, tr.displayNameRequired).max(50, tr.displayNameTooLong),
  });
  const emailSchema = z.object({
    email: z.email(tr.emailRequired),
  });
  const passwordSchema = z.object({
    newPassword: z.string().min(6, tr.passwordHint),
    confirmPassword: z.string().min(1, tr.confirmPasswordRequired),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: tr.passwordsNoMatch,
    path: ["confirmPassword"],
  });
  return { displayNameSchema, emailSchema, passwordSchema };
}

type _SchemasType = ReturnType<typeof makeSchemas>;
type DisplayNameValues = z.infer<_SchemasType["displayNameSchema"]>;
type EmailValues = z.infer<_SchemasType["emailSchema"]>;
type PasswordValues = z.infer<_SchemasType["passwordSchema"]>;

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  displayName: string | null;
  provider: string; // 'google' | 'email'
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function AccountSettingsDialog({
  open,
  onOpenChange,
  email,
  displayName,
  provider,
}: AccountSettingsDialogProps) {
  const router = useRouter();
  const { lang } = useUILanguage();
  const tr = t[lang];
  const { displayNameSchema, emailSchema, passwordSchema } = makeSchemas(tr);
  const isGoogle = provider === "google";

  // Per-section state
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [emailLoading, setEmailLoading] = useState(false);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  /* ---- Forms ---- */

  const nameForm = useForm<DisplayNameValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: { displayName: displayName ?? "" },
  });

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });


  /* ---- Handlers ---- */

  async function handleNameSave(values: DisplayNameValues) {
    setNameError(null);
    setNameSuccess(false);
    setNameLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { display_name: values.displayName.trim() },
      });
      if (error) { setNameError(error.message); return; }
      setNameSuccess(true);
      router.refresh();
    } finally {
      setNameLoading(false);
    }
  }

  async function handleEmailChange(values: EmailValues) {
    setEmailError(null);
    setEmailInfo(null);
    setEmailLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: values.email },
        { emailRedirectTo: `${window.location.origin}/auth/callback` },
      );
      if (error) { setEmailError(error.message); return; }
      setEmailInfo(tr.emailConfirmSent(values.email));
      emailForm.reset();
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordChange(values: PasswordValues) {
    setPwError(null);
    setPwSuccess(false);
    setPwLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) { setPwError(error.message); return; }
      setPwSuccess(true);
      pwForm.reset();
    } finally {
      setPwLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr.accountSettingsTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1">

          {/* Provider badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tr.signedInWith}</span>
            {isGoogle ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <svg className="size-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                Email
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground truncate max-w-[160px]" title={email}>{email}</span>
          </div>

          <Separator />

          {/* ---- Display name ---- */}
          <form onSubmit={nameForm.handleSubmit(handleNameSave)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display-name">{tr.displayNameLabel}</Label>
              <Input
                id="display-name"
                placeholder={tr.displayNamePlaceholder}
                {...nameForm.register("displayName")}
              />
              {nameForm.formState.errors.displayName && (
                <p className="text-xs text-destructive">{nameForm.formState.errors.displayName.message}</p>
              )}
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              {nameSuccess && <p className="text-xs text-emerald-600">{tr.displayNameUpdated}</p>}
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="btn-hover-primary cursor-pointer self-start"
              disabled={nameLoading}
            >
              {nameLoading ? tr.saving : tr.saveName}
            </Button>
          </form>

          <Separator />

          {/* ---- Email ---- */}
          {isGoogle ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{tr.emailLabel}</p>
              <p className="text-xs text-muted-foreground">
                {tr.emailManagedByGoogle}
              </p>
            </div>
          ) : (
            <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-email">{tr.changeEmailLabel}</Label>
                <p className="text-xs text-muted-foreground">{tr.currentEmail(email)}</p>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="new@example.com"
                  {...emailForm.register("email")}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                {emailInfo && <p className="text-xs text-emerald-600">{emailInfo}</p>}
              </div>
              {!emailInfo && (
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="btn-hover-primary cursor-pointer self-start"
                  disabled={emailLoading}
                >
                  {emailLoading ? tr.sending : tr.updateEmail}
                </Button>
              )}
            </form>
          )}

          {/* ---- Password (email users only) ---- */}
          {!isGoogle && (
            <>
              <Separator />
              <form onSubmit={pwForm.handleSubmit(handlePasswordChange)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">{tr.changePasswordLabel}</p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="new-password">{tr.newPasswordLabel}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder={tr.atLeast6Chars}
                      {...pwForm.register("newPassword")}
                    />
                    {pwForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">{pwForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirm-password">{tr.confirmPasswordLabel2}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder={tr.reEnterNewPassword}
                      {...pwForm.register("confirmPassword")}
                    />
                    {pwForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{pwForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  {pwError && <p className="text-xs text-destructive">{pwError}</p>}
                  {pwSuccess && <p className="text-xs text-emerald-600">{tr.passwordUpdated}</p>}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="btn-hover-primary cursor-pointer self-start"
                  disabled={pwLoading}
                >
                  {pwLoading ? tr.updating : tr.updatePassword}
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
