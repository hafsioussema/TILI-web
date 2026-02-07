import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { SlidersHorizontal, Type, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'a11y-preferences';

type TextSize = 'default' | 'lg' | 'xl';
type Spacing = 'default' | 'comfort';

type AccessibilityPrefs = {
    textSize: TextSize;
    highContrast: boolean;
    reduceMotion: boolean;
    strongFocus: boolean;
    spacing: Spacing;
};

const defaultPrefs: AccessibilityPrefs = {
    textSize: 'default',
    highContrast: false,
    reduceMotion: false,
    strongFocus: true,
    spacing: 'default',
};

const applyPrefsToRoot = (prefs: AccessibilityPrefs) => {
    const root = document.documentElement;

    root.classList.toggle('a11y-contrast', prefs.highContrast);
    root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion);
    root.classList.toggle('a11y-focus', prefs.strongFocus);
    root.classList.toggle('a11y-spacing', prefs.spacing === 'comfort');

    root.classList.remove('a11y-text-lg', 'a11y-text-xl');
    if (prefs.textSize === 'lg') {
        root.classList.add('a11y-text-lg');
    }
    if (prefs.textSize === 'xl') {
        root.classList.add('a11y-text-xl');
    }
};

const loadPrefs = (): AccessibilityPrefs => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultPrefs;
        const parsed = JSON.parse(raw) as AccessibilityPrefs;
        return { ...defaultPrefs, ...parsed };
    } catch {
        return defaultPrefs;
    }
};

export const AccessibilityPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [prefs, setPrefs] = useState<AccessibilityPrefs>(loadPrefs);

    useEffect(() => {
        applyPrefsToRoot(prefs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }, [prefs]);

    const isCustomized = useMemo(() => {
        return JSON.stringify(prefs) !== JSON.stringify(defaultPrefs);
    }, [prefs]);

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button
                    className="inline-flex items-center gap-2 h-10 px-3 rounded-full border border-border bg-card text-foreground hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Open accessibility preferences"
                >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm font-semibold">Accessibility</span>
                    {isCustomized && (
                        <span className="ml-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            On
                        </span>
                    )}
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" />
                <Dialog.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]',
                        'rounded-2xl border border-border bg-card shadow-2xl'
                    )}
                    aria-label="Accessibility preferences"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Eye className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold">Accessibility Preferences</Dialog.Title>
                                <Dialog.Description className="text-sm text-muted-foreground">
                                    Make the interface easier to read and navigate.
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close
                            className="touch-target rounded-lg p-2 hover:bg-secondary transition-colors"
                            aria-label="Close accessibility preferences"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </Dialog.Close>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Type className="h-4 w-4 text-primary" aria-hidden="true" />
                                <h3 className="text-sm font-semibold">Text size</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Text size">
                                {[
                                    { value: 'default', label: 'Default' },
                                    { value: 'lg', label: 'Large' },
                                    { value: 'xl', label: 'Extra large' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPrefs((prev) => ({ ...prev, textSize: option.value as TextSize }))}
                                        className={cn(
                                            'h-11 rounded-xl border text-sm font-semibold transition-colors',
                                            prefs.textSize === option.value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-background hover:bg-secondary'
                                        )}
                                        aria-pressed={prefs.textSize === option.value}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-start gap-3 rounded-xl border border-border p-4 bg-background">
                                <input
                                    type="checkbox"
                                    checked={prefs.highContrast}
                                    onChange={(e) => setPrefs((prev) => ({ ...prev, highContrast: e.target.checked }))}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="text-sm font-semibold">High contrast</p>
                                    <p className="text-xs text-muted-foreground">Boosts contrast for text, icons, and borders.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 rounded-xl border border-border p-4 bg-background">
                                <input
                                    type="checkbox"
                                    checked={prefs.reduceMotion}
                                    onChange={(e) => setPrefs((prev) => ({ ...prev, reduceMotion: e.target.checked }))}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="text-sm font-semibold">Reduced motion</p>
                                    <p className="text-xs text-muted-foreground">Limits animations and transitions.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 rounded-xl border border-border p-4 bg-background">
                                <input
                                    type="checkbox"
                                    checked={prefs.strongFocus}
                                    onChange={(e) => setPrefs((prev) => ({ ...prev, strongFocus: e.target.checked }))}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="text-sm font-semibold">Strong focus outlines</p>
                                    <p className="text-xs text-muted-foreground">Makes keyboard focus highly visible.</p>
                                </div>
                            </label>

                            <div className="rounded-xl border border-border p-4 bg-background">
                                <p className="text-sm font-semibold">Spacing</p>
                                <p className="text-xs text-muted-foreground mb-3">Increase breathing room between sections.</p>
                                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Spacing density">
                                    {[
                                        { value: 'default', label: 'Standard' },
                                        { value: 'comfort', label: 'Comfort' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setPrefs((prev) => ({ ...prev, spacing: option.value as Spacing }))}
                                            className={cn(
                                                'h-10 rounded-lg border text-xs font-semibold transition-colors',
                                                prefs.spacing === option.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-background hover:bg-secondary'
                                            )}
                                            aria-pressed={prefs.spacing === option.value}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                        <p className="text-xs text-muted-foreground">
                            Preferences are saved on this device.
                        </p>
                        <button
                            type="button"
                            onClick={() => setPrefs(defaultPrefs)}
                            className="h-9 px-3 rounded-lg border border-border text-sm font-semibold hover:bg-secondary"
                        >
                            Reset
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
