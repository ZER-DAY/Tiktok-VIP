import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  retry?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({ icon, title, description, retry, className }: ErrorStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        {icon || <AlertTriangle className="w-8 h-8 text-destructive" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>}
      {retry && (
        <Button onClick={retry.onClick} variant="outline">
          {retry.label}
        </Button>
      )}
    </div>
  );
}
