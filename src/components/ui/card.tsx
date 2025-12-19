import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        arcade: "bg-gradient-to-br from-card to-background border-border/50 shadow-[0_4px_30px_hsl(var(--background)/0.8)] hover:border-primary/30 hover:shadow-[0_4px_30px_hsl(var(--background)/0.8),0_0_20px_hsl(var(--primary)/0.2)] hover:-translate-y-1",
        neon: "bg-card/80 backdrop-blur-sm border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:border-primary/60 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]",
        "neon-purple": "bg-card/80 backdrop-blur-sm border-secondary/30 shadow-[0_0_20px_hsl(var(--secondary)/0.2)] hover:border-secondary/60 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.4)]",
        "neon-green": "bg-card/80 backdrop-blur-sm border-accent/30 shadow-[0_0_20px_hsl(var(--accent)/0.2)] hover:border-accent/60 hover:shadow-[0_0_30px_hsl(var(--accent)/0.4)]",
        "neon-pink": "bg-card/80 backdrop-blur-sm border-destructive/30 shadow-[0_0_20px_hsl(var(--destructive)/0.2)] hover:border-destructive/60 hover:shadow-[0_0_30px_hsl(var(--destructive)/0.4)]",
        game: "bg-gradient-to-br from-muted/50 to-card border-border hover:border-primary/50 hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] cursor-pointer hover:scale-[1.02]",
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
    <h3 ref={ref} className={cn("text-lg font-pixel leading-none tracking-tight", className)} {...props} />
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
