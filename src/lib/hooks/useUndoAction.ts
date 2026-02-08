import { toast } from 'sonner';

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
            label: 'Undo',
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
