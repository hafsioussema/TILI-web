import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    className?: string;
    noHover?: boolean;
    glass?: boolean;
}

export function AnimatedCard({
    children,
    className,
    noHover = false,
    glass = false,
    ...props
}: AnimatedCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={!noHover ? { y: -5, transition: { duration: 0.2 } } : undefined}
            className={cn(
                "rounded-xl p-6",
                glass ? "glass-card" : "bg-card text-card-foreground border border-border shadow-sm",
                !noHover && "hover:shadow-md hover:border-primary/20",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
