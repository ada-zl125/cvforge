import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ResumeRow } from "@/lib/types/resume";
import { EditorContent } from "@/components/editor/EditorContent";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: resume } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (!resume) redirect("/workspace");

  return <EditorContent resume={resume as ResumeRow} />;
}
