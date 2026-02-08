import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Search, Navigation, Menu, MessageSquare, Zap, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const getShortcuts = (t: any): Shortcut[] => [
    // Navigation
    { keys: ['Tab'], description: t('components.keyboard.shortcuts.tab'), category: t('components.keyboard.categories.navigation') },
    { keys: ['Shift', 'Tab'], description: t('components.keyboard.shortcuts.shiftTab'), category: t('components.keyboard.categories.navigation') },
    { keys: ['Enter'], description: t('components.keyboard.shortcuts.enter'), category: t('components.keyboard.categories.navigation') },
    { keys: ['Space'], description: t('components.keyboard.shortcuts.space'), category: t('components.keyboard.categories.navigation') },
    { keys: ['Escape'], description: t('components.keyboard.shortcuts.escape'), category: t('components.keyboard.categories.navigation') },
    { keys: ['?'], description: t('components.keyboard.shortcuts.questionMark'), category: t('components.keyboard.categories.navigation') },
    { keys: ['Ctrl', '/'], description: t('components.keyboard.shortcuts.ctrlSlash'), category: t('components.keyboard.categories.navigation') },
    
    // Page Navigation
    { keys: ['Alt', 'Home'], description: t('components.keyboard.shortcuts.altHome'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Alt', 'P'], description: t('components.keyboard.shortcuts.altP'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Alt', 'D'], description: t('components.keyboard.shortcuts.altD'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Alt', 'M'], description: t('components.keyboard.shortcuts.altM'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Alt', 'T'], description: t('components.keyboard.shortcuts.altT'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Alt', 'U'], description: t('components.keyboard.shortcuts.altU'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Ctrl', 'B'], description: t('components.keyboard.shortcuts.ctrlB'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Ctrl', '['], description: t('components.keyboard.shortcuts.ctrlBracketLeft'), category: t('components.keyboard.categories.pageNavigation') },
    { keys: ['Ctrl', ']'], description: t('components.keyboard.shortcuts.ctrlBracketRight'), category: t('components.keyboard.categories.pageNavigation') },
    
    // Quick Sequences
    { keys: ['g', 'h'], description: t('components.keyboard.shortcuts.gh'), category: t('components.keyboard.categories.sequences') },
    { keys: ['g', 'p'], description: t('components.keyboard.shortcuts.gp'), category: t('components.keyboard.categories.sequences') },
    { keys: ['g', 'd'], description: t('components.keyboard.shortcuts.gd'), category: t('components.keyboard.categories.sequences') },
    { keys: ['g', 'm'], description: t('components.keyboard.shortcuts.gm'), category: t('components.keyboard.categories.sequences') },
    { keys: ['g', 'u'], description: t('components.keyboard.shortcuts.gu'), category: t('components.keyboard.categories.sequences') },
    
    // Actions
    { keys: ['Ctrl', 'K'], description: t('components.keyboard.shortcuts.ctrlK'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'N'], description: t('components.keyboard.shortcuts.ctrlN'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'Alt', 'N'], description: t('components.keyboard.shortcuts.ctrlAltN'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'S'], description: t('components.keyboard.shortcuts.ctrlS'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'Enter'], description: t('components.keyboard.shortcuts.ctrlEnter'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'Shift', 'P'], description: t('components.keyboard.shortcuts.ctrlShiftP'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'Shift', 'D'], description: t('components.keyboard.shortcuts.ctrlShiftD'), category: t('components.keyboard.categories.actions') },
    { keys: ['Ctrl', 'Shift', 'M'], description: t('components.keyboard.shortcuts.ctrlShiftM'), category: t('components.keyboard.categories.actions') },
    
    // Accessibility
    { keys: ['Skip Link'], description: t('components.keyboard.shortcuts.skipLink'), category: t('components.keyboard.categories.accessibility') },
    { keys: ['H'], description: t('components.keyboard.shortcuts.heading'), category: t('components.keyboard.categories.accessibility') },
    { keys: ['D'], description: t('components.keyboard.shortcuts.landmark'), category: t('components.keyboard.categories.accessibility') },
    
    // Forms
    { keys: ['Tab'], description: t('components.keyboard.shortcuts.formTab'), category: t('components.keyboard.categories.forms') },
    { keys: ['Enter'], description: t('components.keyboard.shortcuts.formEnter'), category: t('components.keyboard.categories.forms') },
    { keys: ['Arrow Keys'], description: t('components.keyboard.shortcuts.arrowKeys'), category: t('components.keyboard.categories.forms') },
];

export const KeyboardShortcutsModal = () => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const shortcuts = getShortcuts(t);

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
                                                {t('components.keyboard.title')}
                                            </Dialog.Title>
                                            <Dialog.Description
                                                id="shortcuts-description"
                                                className="text-sm text-muted-foreground mt-1"
                                            >
                                                {t('components.keyboard.description')}
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
                                    {categories.map((category) => {
                                        let IconComponent = Menu;
                                        if (category === t('components.keyboard.categories.navigation')) IconComponent = Navigation;
                                        if (category === t('components.keyboard.categories.pageNavigation')) IconComponent = ArrowLeftRight;
                                        if (category === t('components.keyboard.categories.sequences')) IconComponent = Zap;
                                        if (category === t('components.keyboard.categories.actions')) IconComponent = Search;
                                        if (category === t('components.keyboard.categories.accessibility')) IconComponent = Menu;
                                        if (category === t('components.keyboard.categories.forms')) IconComponent = MessageSquare;
                                        
                                        return (
                                        <div key={category} className="space-y-3">
                                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <IconComponent className="h-4 w-4 text-primary" aria-hidden="true" />
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
                                        );
                                    })}
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
