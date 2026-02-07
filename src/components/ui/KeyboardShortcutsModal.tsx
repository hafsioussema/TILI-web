import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Search, Navigation, Menu, MessageSquare, Zap, ArrowLeftRight } from 'lucide-react';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const shortcuts: Shortcut[] = [
    // Navigation de base
    { keys: ['Tab'], description: 'Navigate forward through interactive elements', category: 'Navigation de base' },
    { keys: ['Shift', 'Tab'], description: 'Navigate backward through interactive elements', category: 'Navigation de base' },
    { keys: ['Enter'], description: 'Activate buttons and links', category: 'Navigation de base' },
    { keys: ['Space'], description: 'Activate buttons and checkboxes', category: 'Navigation de base' },
    { keys: ['Escape'], description: 'Close modals, clear search, close dropdowns', category: 'Navigation de base' },
    { keys: ['?'], description: 'Show this keyboard shortcuts help', category: 'Navigation de base' },
    { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts (alternative)', category: 'Navigation de base' },
    
    // Navigation rapide entre pages
    { keys: ['Alt', 'Home'], description: 'Go to home page', category: 'Navigation entre pages' },
    { keys: ['Alt', 'P'], description: 'Go to projects page', category: 'Navigation entre pages' },
    { keys: ['Alt', 'D'], description: 'Go to documents page', category: 'Navigation entre pages' },
    { keys: ['Alt', 'M'], description: 'Go to meetings page', category: 'Navigation entre pages' },
    { keys: ['Alt', 'T'], description: 'Go to tasks page', category: 'Navigation entre pages' },
    { keys: ['Alt', 'U'], description: 'Go to users page (admin)', category: 'Navigation entre pages' },
    { keys: ['Ctrl', 'B'], description: 'Go back in history', category: 'Navigation entre pages' },
    { keys: ['Ctrl', '['], description: 'Go back (alternative)', category: 'Navigation entre pages' },
    { keys: ['Ctrl', ']'], description: 'Go forward in history', category: 'Navigation entre pages' },
    
    // Séquences Gmail-style (g + lettre)
    { keys: ['g', 'h'], description: 'Go to home (press g then h)', category: 'Séquences rapides' },
    { keys: ['g', 'p'], description: 'Go to projects (press g then p)', category: 'Séquences rapides' },
    { keys: ['g', 'd'], description: 'Go to documents (press g then d)', category: 'Séquences rapides' },
    { keys: ['g', 'm'], description: 'Go to meetings (press g then m)', category: 'Séquences rapides' },
    { keys: ['g', 'u'], description: 'Go to users (press g then u)', category: 'Séquences rapides' },
    
    // Actions rapides
    { keys: ['Ctrl', 'K'], description: 'Focus search bar (⌘K on Mac, browser safe)', category: 'Actions' },
    { keys: ['Ctrl', 'N'], description: 'Create new item (context-dependent)', category: 'Actions' },
    { keys: ['Ctrl', 'Alt', 'N'], description: 'Create new item (fallback if browser blocks Ctrl+N)', category: 'Actions' },
    { keys: ['Ctrl', 'S'], description: 'Save current form (browser safe)', category: 'Actions' },
    { keys: ['Ctrl', 'Enter'], description: 'Submit form in modal', category: 'Actions' },
    { keys: ['Ctrl', 'Shift', 'P'], description: 'Create new project', category: 'Actions' },
    { keys: ['Ctrl', 'Shift', 'D'], description: 'Create new document', category: 'Actions' },
    { keys: ['Ctrl', 'Shift', 'M'], description: 'Create new meeting', category: 'Actions' },
    
    // Accessibilité
    { keys: ['Skip Link'], description: 'Press Tab once to reveal "Skip to main content"', category: 'Accessibilité' },
    { keys: ['H'], description: 'Navigate by headings (with screen reader)', category: 'Accessibilité' },
    { keys: ['D'], description: 'Navigate by landmarks (with screen reader)', category: 'Accessibilité' },
    
    // Formulaires
    { keys: ['Tab'], description: 'Move between form fields', category: 'Formulaires' },
    { keys: ['Enter'], description: 'Submit form (when not in textarea)', category: 'Formulaires' },
    { keys: ['Arrow Keys'], description: 'Navigate radio buttons and select options', category: 'Formulaires' },
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
                                                {category === 'Navigation de base' && <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Navigation entre pages' && <ArrowLeftRight className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Séquences rapides' && <Zap className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Actions' && <Search className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Accessibilité' && <Menu className="h-4 w-4 text-primary" aria-hidden="true" />}
                                                {category === 'Formulaires' && <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />}
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
