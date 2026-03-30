import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ResumeRow } from "@/lib/types/resume";
import { WorkspaceContent } from "@/components/workspace/WorkspaceContent";

export default async function WorkspacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .order("updated_at", { ascending: false });

  const provider = (user.app_metadata?.provider as string) ?? "email";
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;

  return (
    <WorkspaceContent
      resumes={(resumes as ResumeRow[]) ?? []}
      userEmail={user.email ?? ""}
      displayName={displayName}
      provider={provider}
    />
  );
}
