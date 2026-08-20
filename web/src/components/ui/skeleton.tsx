import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("shimmer rounded-[var(--radius)] border border-border bg-[hsl(220_20%_94%)]", className)} {...props} />
  );
}

export { Skeleton };
