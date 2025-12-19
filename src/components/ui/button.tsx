import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow-sm active:scale-95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-glow-pink active:scale-95",
        outline: "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary hover:shadow-glow-sm active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-glow-purple active:scale-95",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Neon variants
        neon: "bg-transparent border-2 border-primary text-primary font-display text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground hover:shadow-glow-cyan active:scale-95",
        "neon-purple": "bg-transparent border-2 border-secondary text-secondary font-display text-xs uppercase tracking-wider hover:bg-secondary hover:text-secondary-foreground hover:shadow-glow-purple active:scale-95",
        "neon-green": "bg-transparent border-2 border-accent text-accent font-display text-xs uppercase tracking-wider hover:bg-accent hover:text-accent-foreground hover:shadow-glow-green active:scale-95",
        "neon-pink": "bg-transparent border-2 border-destructive text-destructive font-display text-xs uppercase tracking-wider hover:bg-destructive hover:text-destructive-foreground hover:shadow-glow-pink active:scale-95",
        // Premium variants
        arcade: "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-primary-foreground font-display text-xs uppercase tracking-wider hover:bg-[position:100%_0] hover:shadow-glow-cyan active:scale-95 animate-gradient-shift",
        premium: "relative bg-transparent text-foreground font-display text-xs uppercase tracking-wider overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary before:via-secondary before:to-primary before:bg-[length:200%_100%] before:animate-gradient-shift before:-z-10 hover:shadow-glow-cyan active:scale-95",
        glass: "glass text-foreground font-medium hover:bg-muted/50 active:scale-95",
        glow: "bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider shadow-glow-cyan hover:shadow-glow-lg active:scale-95 animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };