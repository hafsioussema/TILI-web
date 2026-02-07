import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const variants = {
            primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            glass: "glass hover:bg-white/90 dark:hover:bg-white/10 text-foreground border-white/20",
            danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25",
        };

        const sizes = {
            sm: "h-10 px-3 text-sm",
            md: "h-12 px-5 text-base",
            lg: "h-14 px-8 text-lg",
            icon: "h-11 w-11 p-2 flex items-center justify-center",
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                    "relative inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 touch-target",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props as any}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}

                {/* Subtle shine effect for primary buttons */}
                {variant === 'primary' && !isLoading && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                    </div>
                )}
            </motion.button>
        );
    }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton };
