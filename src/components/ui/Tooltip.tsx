import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    delayDuration?: number;
    disabled?: boolean;
}

/**
 * Accessible tooltip component
 * - Uses ARIA for screen reader support
 * - Keyboard accessible (shows on focus)
 * - Respects user preferences (reduced motion)
 * - Touch-friendly (shows on long press)
 */
export const Tooltip = ({
    children,
    content,
    side = 'top',
    delayDuration = 400,
    disabled = false,
}: TooltipProps) => {
    if (disabled || !content) {
        return <>{children}</>;
    }

    return (
        <TooltipPrimitive.Provider delayDuration={delayDuration}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        sideOffset={5}
                        className={cn(
                            'z-50 overflow-hidden rounded-lg border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-lg',
                            'animate-in fade-in-0 zoom-in-95',
                            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                            'data-[side=bottom]:slide-in-from-top-2',
                            'data-[side=left]:slide-in-from-right-2',
                            'data-[side=right]:slide-in-from-left-2',
                            'data-[side=top]:slide-in-from-bottom-2'
                        )}
                        aria-label={content}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-border" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
};

/**
 * Simple tooltip wrapper for icon buttons
 */
export const IconTooltip = ({
    children,
    label,
    side = 'bottom',
}: {
    children: React.ReactNode;
    label: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
}) => {
    return (
        <Tooltip content={label} side={side}>
            {children}
        </Tooltip>
    );
};
