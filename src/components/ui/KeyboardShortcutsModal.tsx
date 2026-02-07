import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Search, Navigation, Menu, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const shortcuts: Shortcut[] = [
    // Navigation
    { keys: ['Tab'], description: 'Navigate forward through interactive elements', category: 'Navigation' },
    { keys: ['Shift', 'Tab'], description: 'Navigate backward through interactive elements', category: 'Navigation' },
    { keys: ['Enter'], description: 'Activate buttons and links', category: 'Navigation' },
    { keys: ['Space'], description: 'Activate buttons and checkboxes', category: 'Navigation' },
    { keys: ['Escape'], description: 'Close modals and dialogs', category: 'Navigation' },
    { keys: ['?'], description: 'Show this keyboard shortcuts help', category: 'Navigation' },
    
    // Search & Actions
    { keys: ['Ctrl', 'K'], description: 'Focus search bar (⌘K on Mac)', category: 'Search & Actions' },
    { keys: ['Ctrl', 'N'], description: 'Create new item (context-dependent)', category: 'Search & Actions' },
    { keys: ['Ctrl', 'S'], description: 'Save current form', category: 'Search & Actions' },
    
    // Accessibility
    { keys: ['Skip Link'], description: 'Press Tab once to reveal "Skip to main content"', category: 'Accessibility' },
    { keys: ['H'], description: 'Navigate by headings (with screen reader)', category: 'Accessibility' },
    { keys: ['D'], description: 'Navigate by landmarks (with screen reader)', category: 'Accessibility' },
    
    // Forms
    { keys: ['Tab'], description: 'Move between form fields', category: 'Forms' },
    { keys: ['Enter'], description: 'Submit form (when not in textarea)', category: 'Forms' },
    { keys: ['Arrow Keys'], description: 'Navigate radio buttons and select options', category: 'Forms' },
];

export const KeyboardShortcutsModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Open with ? key (Shift + /)
            if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Don't trigger if user is typing in an input
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
                e.preventDefault();
                setIsOpen(true);
            }
            
            // Close with Escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen]);

    const categories = Array.from(new Set(shortcuts.map(s => s.category)));

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                            />
                        </Dialog.Overlay>

                        <Dialog.Content asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-6 border border-border bg-card p-6 shadow-2xl duration-200 rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
                                role="dialog"
                                aria-labelledby="shortcuts-title"
                                aria-describedby="shortcuts-description"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <Dialog.Title
                                                id="shortcuts-title"
                                                className="text-xl font-semibold text-foreground"
                                            >
                                                Keyboard Shortcuts
                                            </Dialog.Title>
                                            <Dialog.Description
                                                id="shortcuts-description"
                                                className="text-sm text-muted-foreground mt-1"
                                            >
                                                Navigate TILI Workspace efficiently with keyboard shortcuts
                                            </Dialog.Description>
                                        </div>
                                    </div>
                                    <Dialog.Close
                                        className="rounded-lg p-2 hover:bg-secondary transition-colors touch-target"
                                        aria-label="Close keyboard shortcuts help"
                                    >
                                        <X className="h-5 w-5" aria-hidden="true" />
                                    </Dialog.Close>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                                    {categories.map((category) => (
                                        <div key={category} className="space-y-3">
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                {category === 'Navigation' && <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Search & Actions' && <Search className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Accessibility' && <Menu className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Forms' && <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category}
                                            </h3>
                                            <div className="space-y-2">
                                                {shortcuts
                                                    .filter((s) => s.category === category)
                                                    .map((shortcut, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                                                        >
                                                            <span className="text-sm text-foreground">
                                                                {shortcut.description}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {shortcut.keys.map((key, i) => (
                                                                    <span key={i} className="inline-flex items-center">
                                                                        <kbd
                                                                            className="px-2 py-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded shadow-sm"
                                                                            aria-label={key}
                                                                        >
                                                                            {key}
                                                                        </kbd>
                                                                        {i < shortcut.keys.length - 1 && (
                                                                            <span className="mx-1 text-muted-foreground">+</span>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border pt-4 text-center">
                                    <p className="text-xs text-muted-foreground">
                                        Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-secondary border border-border rounded">?</kbd> anytime to view this help
                                    </p>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
};
