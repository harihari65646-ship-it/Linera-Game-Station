import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card shadow-md",
        arcade: "bg-gradient-to-br from-card to-background border-border/50 shadow-lg hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] hover:-translate-y-1",
        glass: "glass-card hover:border-primary/30 hover:shadow-glow-cyan hover:-translate-y-1",
        neon: "bg-card/80 backdrop-blur-sm border-primary/40 shadow-glow-sm hover:border-primary hover:shadow-glow-md",
        "neon-purple": "bg-card/80 backdrop-blur-sm border-secondary/40 shadow-[0_0_20px_hsl(var(--secondary)/0.2)] hover:border-secondary hover:shadow-[0_0_30px_hsl(var(--secondary)/0.4)]",
        "neon-green": "bg-card/80 backdrop-blur-sm border-accent/40 shadow-[0_0_20px_hsl(var(--accent)/0.2)] hover:border-accent hover:shadow-[0_0_30px_hsl(var(--accent)/0.4)]",
        "neon-pink": "bg-card/80 backdrop-blur-sm border-destructive/40 shadow-[0_0_20px_hsl(var(--destructive)/0.2)] hover:border-destructive hover:shadow-[0_0_30px_hsl(var(--destructive)/0.4)]",
        game: "bg-gradient-to-br from-muted/30 to-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-glow-cyan cursor-pointer hover:scale-[1.02]",
        premium: "glass-card border-0 relative before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-br before:from-primary/50 before:via-secondary/50 before:to-accent/50 before:-z-10 hover:shadow-glow-cyan hover:-translate-y-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-display font-bold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };