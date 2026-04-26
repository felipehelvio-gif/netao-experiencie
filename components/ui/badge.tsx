import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-santafe-orange text-santafe-black',
        navy: 'bg-santafe-navy text-santafe-cream',
        outline: 'border-2 border-santafe-navy text-santafe-navy',
        success: 'bg-emerald-600 text-white',
        muted: 'bg-muted text-muted-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        warning: 'bg-amber-500 text-amber-950',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
