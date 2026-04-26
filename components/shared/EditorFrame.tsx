"use client";

interface EditorFrameProps {
  toolbar: React.ReactNode;
  form: React.ReactNode;
  preview: React.ReactNode;
}

export function EditorFrame({ toolbar, form, preview }: EditorFrameProps) {
  return (
    <div className="flex h-screen flex-col">
      {toolbar}

      <div className="-mt-px flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Form panel (40%) */}
        <div className="editor-form-pane relative z-10 w-2/5 shrink-0 overflow-y-auto rounded-tr-lg border-r border-t border-border">
          {form}
        </div>

        {/* Right: Preview panel (60%) */}
        {preview}
      </div>
    </div>
  );
}
