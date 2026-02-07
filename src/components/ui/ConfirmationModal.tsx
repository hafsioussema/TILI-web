import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger'
}: ConfirmationModalProps) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    // Focus cancel button when modal opens (safer default for destructive actions)
    useEffect(() => {
        if (isOpen && cancelButtonRef.current) {
            setTimeout(() => {
                cancelButtonRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                            />
                        </Dialog.Overlay>

                        {/* Content */}
                        <Dialog.Content 
                            asChild
                            onKeyDown={handleKeyDown}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 sm:rounded-lg"
                                role="alertdialog"
                                aria-labelledby="confirmation-title"
                                aria-describedby="confirmation-description"
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                            variant === 'danger' ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                        )}>
                                            <AlertTriangle size={20} aria-hidden="true" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Dialog.Title 
                                                id="confirmation-title"
                                                className="text-lg font-semibold leading-none tracking-tight"
                                            >
                                                {title}
                                            </Dialog.Title>
                                            <Dialog.Description 
                                                id="confirmation-description"
                                                className="text-sm text-muted-foreground"
                                            >
                                                {description}
                                            </Dialog.Description>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
                                    <button
                                        ref={cancelButtonRef}
                                        onClick={onClose}
                                        className="touch-target inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground px-4 py-2"
                                        aria-label={`${cancelLabel} and close dialog`}
                                    >
                                        {cancelLabel}
                                    </button>
                                    <button
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={cn(
                                            "touch-target inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow px-4 py-2",
                                            variant === 'danger'
                                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                        aria-label={`${confirmLabel} and proceed with action`}
                                    >
                                        {confirmLabel}
                                    </button>
                                </div>
                                <Dialog.Close 
                                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground touch-target"
                                    aria-label="Close dialog"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                    <span className="sr-only">Close</span>
                                </Dialog.Close>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
};
