import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { SlidersHorizontal, Type, Eye, X, Palette, BookOpen, Volume2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTTS } from '@/features/tts/useTTS';
import { useLanguage } from '@/features/i18n';

const STORAGE_KEY = 'a11y-preferences';

type TextSize = 'default' | 'lg' | 'xl';
type Spacing = 'default' | 'comfort';
type ColorBlindnessFilter = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
type DyslexiaFont = 'default' | 'opendyslexic' | 'arial' | 'comicsans' | 'verdana';
type DyslexiaBackground = 'default' | 'cream' | 'lightblue' | 'lightgray';

type AccessibilityPrefs = {
    textSize: TextSize;
    highContrast: boolean;
    reduceMotion: boolean;
    strongFocus: boolean;
    spacing: Spacing;
    colorBlindness: ColorBlindnessFilter;
    dyslexiaFont: DyslexiaFont;
    dyslexiaBackground: DyslexiaBackground;
    dyslexiaSpacing: boolean;
    dyslexiaLineWidth: boolean;
    dyslexiaDisableItalics: boolean;
};

const defaultPrefs: AccessibilityPrefs = {
    textSize: 'default',
    highContrast: false,
    reduceMotion: false,
    strongFocus: true,
    spacing: 'default',
    colorBlindness: 'none',
    dyslexiaFont: 'default',
    dyslexiaBackground: 'default',
    dyslexiaSpacing: false,
    dyslexiaLineWidth: false,
    dyslexiaDisableItalics: false,
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

    // Apply color blindness filters
    root.classList.remove('a11y-protanopia', 'a11y-deuteranopia', 'a11y-tritanopia', 'a11y-achromatopsia');
    if (prefs.colorBlindness !== 'none') {
        root.classList.add(`a11y-${prefs.colorBlindness}`);
    }

    // Apply dyslexia font
    root.classList.remove('a11y-dyslexia-opendyslexic', 'a11y-dyslexia-arial', 'a11y-dyslexia-comicsans', 'a11y-dyslexia-verdana');
    if (prefs.dyslexiaFont !== 'default') {
        root.classList.add(`a11y-dyslexia-${prefs.dyslexiaFont}`);
    }

    // Apply dyslexia background
    root.classList.remove('a11y-dyslexia-bg-cream', 'a11y-dyslexia-bg-lightblue', 'a11y-dyslexia-bg-lightgray');
    if (prefs.dyslexiaBackground !== 'default') {
        root.classList.add(`a11y-dyslexia-bg-${prefs.dyslexiaBackground}`);
    }

    // Apply dyslexia settings
    root.classList.toggle('a11y-dyslexia-spacing', prefs.dyslexiaSpacing);
    root.classList.toggle('a11y-dyslexia-linewidth', prefs.dyslexiaLineWidth);
    root.classList.toggle('a11y-dyslexia-no-italics', prefs.dyslexiaDisableItalics);
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
    const { settings: ttsSettings, updateSettings: updateTTSSettings, voices, isAvailable: ttsAvailable, speak } = useTTS();
    const { currentLanguage, changeLanguage, availableLanguages, t } = useLanguage();

    useEffect(() => {
        applyPrefsToRoot(prefs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    }, [prefs]);

    const isCustomized = useMemo(() => {
        return JSON.stringify(prefs) !== JSON.stringify(defaultPrefs);
    }, [prefs]);

    // Check if current language has a matching voice
    const hasVoiceForCurrentLanguage = useMemo(() => {
        const langMap: Record<string, string[]> = {
            'en': ['en-US', 'en-GB', 'en'],
            'fr': ['fr-FR', 'fr-CA', 'fr'],
            'ar': ['ar-SA', 'ar-AE', 'ar'],
            'tn': ['ar-TN', 'ar-DZ', 'ar'],
        };
        
        const preferredLangs = langMap[currentLanguage] || [currentLanguage];
        
        for (const lang of preferredLangs) {
            if (voices.some(v => v.lang.startsWith(lang))) {
                return true;
            }
        }
        
        return false;
    }, [currentLanguage, voices]);

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            {/* SVG Filters for Color Blindness Simulation (WCAG 2.1 compliant) */}
            <svg className="sr-only" aria-hidden="true">
                <defs>
                    {/* Protanopia (Red-Blind) */}
                    <filter id="protanopia">
                        <feColorMatrix type="matrix" values="0.567, 0.433, 0,     0, 0
                                                               0.558, 0.442, 0,     0, 0
                                                               0,     0.242, 0.758, 0, 0
                                                               0,     0,     0,     1, 0"/>
                    </filter>
                    {/* Deuteranopia (Green-Blind) */}
                    <filter id="deuteranopia">
                        <feColorMatrix type="matrix" values="0.625, 0.375, 0,   0, 0
                                                               0.7,   0.3,   0,   0, 0
                                                               0,     0.3,   0.7, 0, 0
                                                               0,     0,     0,   1, 0"/>
                    </filter>
                    {/* Tritanopia (Blue-Blind) */}
                    <filter id="tritanopia">
                        <feColorMatrix type="matrix" values="0.95, 0.05,  0,     0, 0
                                                               0,    0.433, 0.567, 0, 0
                                                               0,    0.475, 0.525, 0, 0
                                                               0,    0,     0,     1, 0"/>
                    </filter>
                    {/* Achromatopsia (Total Color Blindness) */}
                    <filter id="achromatopsia">
                        <feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0
                                                               0.299, 0.587, 0.114, 0, 0
                                                               0.299, 0.587, 0.114, 0, 0
                                                               0,     0,     0,     1, 0"/>
                    </filter>
                </defs>
            </svg>

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
                        'fixed left-[50%] top-[50%] z-50 w-full max-w-3xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%]',
                        'rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col'
                    )}
                    aria-label="Accessibility preferences"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
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

                    <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
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

                        {/* Color Blindness Filters (WCAG 2.1) */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
                                <h3 className="text-sm font-semibold">Color blindness filters</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Simulates different types of color vision deficiency (WCAG 2.1 compliant).
                            </p>
                            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Color blindness filter">
                                {[
                                    { value: 'none', label: 'No filter', description: 'Standard color vision' },
                                    { value: 'protanopia', label: 'Protanopia', description: 'Red-blind (affects ~1% of males)' },
                                    { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind (affects ~1% of males)' },
                                    { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind (rare)' },
                                    { value: 'achromatopsia', label: 'Achromatopsia', description: 'Total color blindness (very rare)' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPrefs((prev) => ({ ...prev, colorBlindness: option.value as ColorBlindnessFilter }))}
                                        className={cn(
                                            'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                                            prefs.colorBlindness === option.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border bg-background hover:bg-secondary'
                                        )}
                                        aria-pressed={prefs.colorBlindness === option.value}
                                    >
                                        <div className={cn(
                                            'mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                            prefs.colorBlindness === option.value
                                                ? 'border-primary bg-primary'
                                                : 'border-border bg-background'
                                        )}>
                                            {prefs.colorBlindness === option.value && (
                                                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn(
                                                'text-sm font-semibold',
                                                prefs.colorBlindness === option.value ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dyslexia-Friendly Settings */}
                        <div className="space-y-4 border-t border-border pt-6">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                                <h3 className="text-sm font-semibold">Dyslexia-friendly settings</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Optimized typography and layout for easier reading (British Dyslexia Association guidelines).
                            </p>

                            {/* Font Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">Font family</label>
                                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Dyslexia font">
                                    {[
                                        { value: 'default', label: 'Default', description: 'System font' },
                                        { value: 'opendyslexic', label: 'OpenDyslexic', description: 'Specialized font' },
                                        { value: 'arial', label: 'Arial', description: 'Clean sans-serif' },
                                        { value: 'comicsans', label: 'Comic Sans', description: 'Friendly rounded' },
                                        { value: 'verdana', label: 'Verdana', description: 'Wide spacing' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setPrefs((prev) => ({ ...prev, dyslexiaFont: option.value as DyslexiaFont }))}
                                            className={cn(
                                                'h-auto py-2.5 px-3 rounded-lg border text-left transition-colors',
                                                prefs.dyslexiaFont === option.value
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border bg-background hover:bg-secondary'
                                            )}
                                            aria-pressed={prefs.dyslexiaFont === option.value}
                                        >
                                            <p className={cn(
                                                'text-sm font-semibold',
                                                prefs.dyslexiaFont === option.value ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{option.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Background Color */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">Background color</label>
                                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Background color">
                                    {[
                                        { value: 'default', label: 'Default', color: 'bg-background' },
                                        { value: 'cream', label: 'Cream', color: 'bg-[#FAFAF0]' },
                                        { value: 'lightblue', label: 'Light Blue', color: 'bg-[#E8F4F8]' },
                                        { value: 'lightgray', label: 'Light Gray', color: 'bg-[#F5F5F5]' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setPrefs((prev) => ({ ...prev, dyslexiaBackground: option.value as DyslexiaBackground }))}
                                            className={cn(
                                                'h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1',
                                                prefs.dyslexiaBackground === option.value
                                                    ? 'border-primary ring-2 ring-primary/20'
                                                    : 'border-border hover:border-primary/50'
                                            )}
                                            aria-pressed={prefs.dyslexiaBackground === option.value}
                                        >
                                            <div className={cn('w-8 h-8 rounded-md border border-border', option.color)} />
                                            <span className="text-xs font-medium">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reading Aids */}
                            <div className="grid grid-cols-1 gap-3">
                                <label className="flex items-start gap-3 rounded-xl border border-border p-3 bg-background cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={prefs.dyslexiaSpacing}
                                        onChange={(e) => setPrefs((prev) => ({ ...prev, dyslexiaSpacing: e.target.checked }))}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">Enhanced spacing</p>
                                        <p className="text-xs text-muted-foreground">
                                            Increased letter spacing (0.12em), word spacing (0.16em), and line height (1.8)
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 rounded-xl border border-border p-3 bg-background cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={prefs.dyslexiaLineWidth}
                                        onChange={(e) => setPrefs((prev) => ({ ...prev, dyslexiaLineWidth: e.target.checked }))}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">Limit line width</p>
                                        <p className="text-xs text-muted-foreground">
                                            Maximum 70 characters per line for easier reading
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 rounded-xl border border-border p-3 bg-background cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={prefs.dyslexiaDisableItalics}
                                        onChange={(e) => setPrefs((prev) => ({ ...prev, dyslexiaDisableItalics: e.target.checked }))}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">Disable italics</p>
                                        <p className="text-xs text-muted-foreground">
                                            Replace italic text with bold or color for emphasis
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Language (WCAG 3.1.1) */}
                        <div className="space-y-4 border-t border-border pt-6">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
                                <h3 className="text-sm font-semibold">{t('accessibility.languageTitle')}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('accessibility.languageDesc')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {availableLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        type="button"
                                        onClick={() => changeLanguage(lang.code)}
                                        className={cn(
                                            'rounded-xl border border-border p-3 text-left transition-colors',
                                            currentLanguage === lang.code
                                                ? 'bg-primary/10 text-primary border-primary/30'
                                                : 'bg-background hover:bg-secondary/50'
                                        )}
                                    >
                                        <div className="text-sm font-semibold">{lang.nativeName}</div>
                                        <div className="text-xs text-muted-foreground">{lang.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text-to-Speech (WCAG 2.1) */}
                        {ttsAvailable && (
                            <div className="space-y-4 border-t border-border pt-6">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
                                    <h3 className="text-sm font-semibold">Text-to-Speech (Voice-Over)</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Read text aloud using your browser's speech synthesis (WCAG 2.1 SC 1.4.2, 3.1.1).
                                </p>

                                {/* Enable TTS */}
                                <label className="flex items-start gap-3 rounded-xl border border-border p-3 bg-background cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={ttsSettings.enabled}
                                        onChange={(e) => updateTTSSettings({ enabled: e.target.checked })}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">Enable Text-to-Speech</p>
                                        <p className="text-xs text-muted-foreground">
                                            Show floating controls for reading text aloud
                                        </p>
                                    </div>
                                </label>

                                {/* Test TTS Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (ttsSettings.enabled) {
                                            // Speak test phrase in current language
                                            const testPhrases: Record<string, string> = {
                                                'en': 'Hello, this is a voice reading test in English.',
                                                'fr': 'Bonjour, ceci est un test de lecture vocale en français.',
                                                'ar': 'مرحباً، هذا اختبار للقراءة الصوتية باللغة العربية.',
                                                'tn': 'مرحبا، هذاش اختبار للقراءة الصوتية بالتونسي.',
                                            };
                                            const testPhrase = testPhrases[currentLanguage] || testPhrases['en'];
                                            speak(testPhrase);
                                        } else {
                                            alert("Please enable Text-to-Speech first!");
                                        }
                                    }}
                                    className="w-full rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary p-3 text-sm font-semibold transition-colors"
                                >
                                    🔊 Test Voice (Hear current language)
                                </button>

                                {/* Warning if no voice for current language */}
                                {!hasVoiceForCurrentLanguage && (
                                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
                                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
                                            ⚠️ {currentLanguage === 'ar' ? 'Arabic (العربية)' : currentLanguage === 'tn' ? 'Tunisian Arabic (العربية التونسية)' : currentLanguage.toUpperCase()} voice not available
                                        </p>
                                        <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                                            Your system doesn't have voices for this language installed yet.
                                        </p>
                                        {(currentLanguage === 'ar' || currentLanguage === 'tn') && (
                                            <div className="text-xs bg-orange-500/20 rounded-lg p-2 space-y-1">
                                                <p className="font-semibold">📥 How to add Arabic voices:</p>
                                                <div className="space-y-1 text-orange-700 dark:text-orange-300">
                                                    <p><strong>Windows 11/10:</strong></p>
                                                    <p className="ml-2">1. Open Settings → Time & Language → Speech</p>
                                                    <p className="ml-2">2. Under "Voices", click "Manage voices"</p>
                                                    <p className="ml-2">3. Click the "+" button and select Arabic languages</p>
                                                    <p className="ml-2">4. Download "Arabic (Saudi Arabia)" or "Arabic (Egypt)"</p>
                                                    <p className="mt-2"><strong>macOS/iOS:</strong></p>
                                                    <p className="ml-2">1. System Preferences → Accessibility → Spoken Content</p>
                                                    <p className="ml-2">2. Click "System Voice" dropdown and select Arabic</p>
                                                    <p className="mt-2"><strong>Browser Web Speech API:</strong></p>
                                                    <p className="ml-2">Uses system voices. Text will fallback to English if Arabic voices unavailable.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {ttsSettings.enabled && (
                                    <>
                                        {/* Voice Selection - Filter by current language */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Voice</label>
                                            <select
                                                value={ttsSettings.voice || ''}
                                                onChange={(e) => updateTTSSettings({ voice: e.target.value })}
                                                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                                            >
                                                <option value="">-- Auto select voice --</option>
                                                {voices.map((voice) => (
                                                    <option key={voice.name} value={voice.name}>
                                                        {voice.name} ({voice.lang})
                                                    </option>
                                                ))}
                                            </select>
                                            {voices.length === 0 && (
                                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                                    ⚠️ No voices available on this system. Please install text-to-speech voices.
                                                </p>
                                            )}
                                        </div>

                                        {/* Rate Control */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium">Speed</label>
                                                <span className="text-xs text-muted-foreground">{ttsSettings.rate.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={ttsSettings.rate}
                                                onChange={(e) => updateTTSSettings({ rate: parseFloat(e.target.value) })}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Slower</span>
                                                <span>Faster</span>
                                            </div>
                                        </div>

                                        {/* Pitch Control */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium">Pitch</label>
                                                <span className="text-xs text-muted-foreground">{ttsSettings.pitch.toFixed(1)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={ttsSettings.pitch}
                                                onChange={(e) => updateTTSSettings({ pitch: parseFloat(e.target.value) })}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Lower</span>
                                                <span>Higher</span>
                                            </div>
                                        </div>

                                        {/* Volume Control */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium">Volume</label>
                                                <span className="text-xs text-muted-foreground">{Math.round(ttsSettings.volume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={ttsSettings.volume}
                                                onChange={(e) => updateTTSSettings({ volume: parseFloat(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Auto-read Focused Elements */}
                                        <label className="flex items-start gap-3 rounded-xl border border-border p-3 bg-background cursor-pointer hover:bg-secondary/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={ttsSettings.autoReadFocus}
                                                onChange={(e) => updateTTSSettings({ autoReadFocus: e.target.checked })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold">Speak selected items (Tab navigation)</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Use Tab key to navigate. When focused on an item, the speaker automatically reads it aloud (WCAG 2.1 SC 2.1.1, 2.4.11)
                                                </p>
                                            </div>
                                        </label>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
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
