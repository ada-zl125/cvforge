"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AccountSettingsDialog } from "./AccountSettingsDialog";

interface SidebarProps {
  userEmail: string;
  displayName: string | null;
  provider: string;
  onNewResume: () => void;
}

export function Sidebar({ userEmail, displayName, provider, onNewResume }: SidebarProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const label = displayName || userEmail.split("@")[0];
  const initials = label.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <aside className="sidebar-hover flex w-[260px] shrink-0 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="px-5 pt-6 pb-2">
          <span className="text-xl font-bold tracking-tight">
            Easy<span className="text-primary">CV</span>
          </span>
        </div>

        {/* New Resume button */}
        <div className="px-4 py-4">
          <Button
            variant="outline"
            className="btn-hover-border w-full cursor-pointer justify-center gap-2"
            onClick={onNewResume}
          >
            <Plus className="size-4" />
            New Resume
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User section — click to open account settings */}
        <div className="sidebar-inner-border flex items-center gap-3 border-t px-4 py-4">
          {/* Avatar + name area (clickable) */}
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted"
            onClick={() => setSettingsOpen(true)}
            aria-label="Account settings"
          >
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground leading-tight">
                {label}
              </span>
              {displayName && (
                <span className="truncate text-xs text-muted-foreground leading-tight">
                  {userEmail}
                </span>
              )}
            </div>
            <Settings className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
          </button>

          {/* Sign out button */}
          <Button
            variant="ghost"
            size="icon-xs"
            className="cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        email={userEmail}
        displayName={displayName}
        provider={provider}
      />
    </>
  );
}
