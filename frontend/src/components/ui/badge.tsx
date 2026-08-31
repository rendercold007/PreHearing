import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

// shadcn Badge, retinted to the app's amber/coral tokens (see index.css @theme).
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-accent/30 bg-accent-soft text-accent",
        coral: "border-coral/30 bg-coral-soft text-coral",
        muted: "border-line bg-white/[0.03] text-muted",
        outline: "border-line bg-transparent text-fg",
        danger: "border-danger/30 bg-danger-bg text-danger",
        warning: "border-warning/30 bg-warning-bg text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
