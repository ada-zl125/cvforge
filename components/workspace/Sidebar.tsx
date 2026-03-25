"use client";

import { useRouter } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  userEmail: string;
  onNewResume: () => void;
}

export function Sidebar({ userEmail, onNewResume }: SidebarProps) {
  const router = useRouter();

  const initials = userEmail
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
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

      {/* User section */}
      <div className="sidebar-inner-border flex items-center gap-3 border-t px-4 py-4">
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-sm font-medium text-muted-foreground">
          {userEmail}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="cursor-pointer"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
