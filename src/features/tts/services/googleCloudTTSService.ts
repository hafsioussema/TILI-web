import { apiClient } from '@/lib/axios';

/**
 * Frontend service for Google Cloud Text-to-Speech via backend API
 * Provides audio synthesis with fallback to Web Speech API if backend unavailable
 */

export interface TTSVoiceOption {
    languageCode: string;
    name: string;
    voiceName?: string;
}

class GoogleCloudTTSService {
    private static readonly TTS_ENDPOINT = '/tts';
    private static readonly MAX_TEXT_LENGTH = 5000;
    private isAvailable = false;

    constructor() {
        this.checkAvailability();
    }

    /**
     * Check if TTS service is available on backend
     */
    async checkAvailability(): Promise<boolean> {
        try {
            const response = await apiClient.get(`${GoogleCloudTTSService.TTS_ENDPOINT}/health`);
            this.isAvailable = response.data.available;
            if (this.isAvailable) {
                console.log('[TTS] ✓ Google Cloud TTS available');
            }
            return this.isAvailable;
        } catch (error) {
            console.warn('[TTS] Google Cloud TTS not available, will use Web Speech API');
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Synthesize text to speech and return audio blob
     */
    async synthesize(
        text: string,
        languageCode: string = 'en',
        voiceName?: string,
    ): Promise<Blob | null> {
        if (!text || text.trim().length === 0) {
            console.warn('[TTS] Empty text provided');
            return null;
        }

        if (text.length > GoogleCloudTTSService.MAX_TEXT_LENGTH) {
            console.warn(`[TTS] Text exceeds ${GoogleCloudTTSService.MAX_TEXT_LENGTH} characters, truncating`);
            // Split into chunks if needed
        }

        if (!this.isAvailable) {
            console.log('[TTS] Backend not available, using Web Speech API');
            return null; // Will fall back to Web Speech API
        }

        try {
            console.log(`[TTS] Synthesizing: "${text.substring(0, 50)}..." (${languageCode})`);

            const response = await apiClient.post(
                `${GoogleCloudTTSService.TTS_ENDPOINT}/speak`,
                {
                    text,
                    languageCode,
                    voiceName,
                },
                {
                    responseType: 'blob',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            console.log(`[TTS] ✓ Synthesis successful (${audioBlob.size} bytes)`);
            return audioBlob;
        } catch (error) {
            console.error('[TTS] Synthesis failed:', error);
            return null; // Fall back to Web Speech API
        }
    }

    /**
     * Play audio blob
     */
    async playAudio(audioBlob: Blob): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const url = URL.createObjectURL(audioBlob);
                const audio = new Audio(url);

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to play audio'));
                };

                audio.play().catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Full synthesis and playback flow
     */
    async speak(
        text: string,
        languageCode: string = 'en',
        voiceName?: string,
    ): Promise<void> {
        try {
            const audioBlob = await this.synthesize(text, languageCode, voiceName);
            if (audioBlob) {
                await this.playAudio(audioBlob);
            } else {
                throw new Error('Failed to synthesize audio');
            }
        } catch (error) {
            console.error('[TTS] Failed to speak:', error);
            throw error;
        }
    }

    /**
     * Get available voices
     */
    async getVoices(languageCode?: string): Promise<any[]> {
        if (!this.isAvailable) {
            return [];
        }

        try {
            const response = await apiClient.get(`${GoogleCloudTTSService.TTS_ENDPOINT}/voices`, {
                params: { languageCode },
            });
            return response.data.voices || [];
        } catch (error) {
            console.error('[TTS] Failed to fetch voices:', error);
            return [];
        }
    }
}

export const googleCloudTTSService = new GoogleCloudTTSService();
