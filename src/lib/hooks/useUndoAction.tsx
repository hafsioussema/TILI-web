import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';

interface UndoAction {
    message: string;
    onUndo: () => void | Promise<void>;
}

/**
 * Show a toast with an undo action
 * Provides users a way to reverse destructive actions (WCAG 2.1 SC 3.3.4)
 */
export const showUndoableToast = ({ message, onUndo }: UndoAction) => {
    toast.success(message, {
        duration: 5000,
        action: {
            label: (
                <span className="inline-flex items-center gap-1">
                    <Undo2 className="h-3 w-3" aria-hidden="true" />
                    Undo
                </span>
            ),
            onClick: async () => {
                try {
                    await onUndo();
                    toast.success('Action undone');
                } catch (error) {
                    toast.error('Failed to undo action');
                }
            },
        },
    });
};

/**
 * Hook to provide undo functionality for destructive actions
 */
export const useUndoAction = () => {
    return showUndoableToast;
};
