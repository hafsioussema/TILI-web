import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useTranslation } from 'react-i18next';

// Warning shows 2 minutes before timeout
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const SessionTimeoutWarning = () => {
    const { token, checkAuth } = useAuthStore();
    const { t } = useTranslation('common');
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Reset activity timer on user interaction
    const resetTimer = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
    }, []);

    // Extend session
    const handleExtendSession = useCallback(() => {
        resetTimer();
        checkAuth(); // Refresh token
    }, [resetTimer, checkAuth]);

    // Monitor user activity
    useEffect(() => {
        if (!token) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [token, resetTimer]);

    // Check for timeout
    useEffect(() => {
        if (!token) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastActivity;
            const remaining = SESSION_TIMEOUT - elapsed;

            if (remaining <= 0) {
                // Session expired
                setShowWarning(false);
                // The auth store will handle logout via interceptor
            } else if (remaining <= WARNING_TIME) {
                // Show warning
                setShowWarning(true);
                setTimeLeft(Math.floor(remaining / 1000));
            } else {
                setShowWarning(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [token, lastActivity]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!token || !showWarning) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full mx-4"
                role="alertdialog"
                aria-labelledby="session-timeout-title"
                aria-describedby="session-timeout-description"
                aria-live="assertive"
            >
                <div className="bg-card border-2 border-destructive/50 rounded-xl shadow-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 
                                id="session-timeout-title" 
                                className="text-lg font-semibold text-foreground mb-1"
                            >
                                {t('components.sessionTimeout.title')}
                            </h2>
                            <p 
                                id="session-timeout-description" 
                                className="text-sm text-muted-foreground mb-4"
                            >
                                Your session will expire in <strong className="text-destructive font-bold">{formatTime(timeLeft)}</strong> due to inactivity. Click below to continue your session.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExtendSession}
                                    className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 touch-target-sm"
                                    aria-label="Extend session and stay logged in"
                                >
                                    <Clock className="inline h-4 w-4 mr-2" aria-hidden="true" />
                                    {t('components.sessionTimeout.extendButton')}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Screen reader announcement */}
                    <div className="sr-only" role="timer" aria-live="off">
                        Session timeout in {formatTime(timeLeft)}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
