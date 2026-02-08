export type Language = 'en' | 'fr' | 'ar' | 'tn';

export const availableLanguages: Array<{ code: Language; name: string; nativeName: string }> = [
	{ code: 'en', name: 'English', nativeName: 'English' },
	{ code: 'fr', name: 'Français', nativeName: 'Français' },
	{ code: 'ar', name: 'Arabic', nativeName: 'العربية' },
	{ code: 'tn', name: 'Tunisian Arabic', nativeName: 'العربية التونسية' },
];

export const isRtlLanguage = (lang: string) => lang === 'ar' || lang === 'tn';
