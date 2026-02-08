import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { availableLanguages, isRtlLanguage } from './LanguageContext';
import type { Language } from './LanguageContext';

const normalizeLanguage = (lang: string): Language => {
	const normalized = lang.split('-')[0];
	if (normalized === 'fr' || normalized === 'ar' || normalized === 'tn') {
		return normalized;
	}
	return 'en';
};

export const useLanguage = () => {
	const { i18n, t } = useTranslation('common');
	const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language || 'en');

	const applyDocumentDirection = (lang: string) => {
		if (typeof document === 'undefined') return;
		const dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
		document.documentElement.dir = dir;
		document.documentElement.lang = lang;
	};

	const changeLanguage = async (lang: Language) => {
		await i18n.changeLanguage(lang);
		applyDocumentDirection(lang);
	};

	useEffect(() => {
		applyDocumentDirection(currentLanguage);
	}, [currentLanguage]);

	return {
		currentLanguage,
		changeLanguage,
		availableLanguages,
		t,
	};
};
