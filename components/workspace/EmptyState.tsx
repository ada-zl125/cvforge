import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onNewResume: () => void;
}

export function EmptyState({ onNewResume }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-muted">
        <FilePlus className="size-8 text-muted-foreground" />
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-lg font-semibold">No resumes yet</h2>
        <p className="max-w-[280px] text-sm text-muted-foreground">
          Create your first resume to get started. It only takes a few minutes.
        </p>
      </div>

      <Button variant="outline" className="btn-hover-border cursor-pointer gap-2" onClick={onNewResume}>
        <Plus className="size-4" />
        Create Your First Resume
      </Button>
    </div>
  );
}
