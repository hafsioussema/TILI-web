import React, { useEffect, useState, useCallback } from 'react';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types';
import { Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export const WeeklyCalendar: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
    const [loading, setLoading] = useState(true);
    const { t, i18n } = useTranslation('common');
    const locale = i18n.resolvedLanguage?.startsWith('fr')
        ? 'fr-FR'
        : i18n.resolvedLanguage?.startsWith('ar') || i18n.resolvedLanguage?.startsWith('tn')
            ? 'ar-TN'
            : 'en-US';

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const data = await meetingService.getAllMeetings();
            setMeetings(data);
        } catch (error) {
            console.error('Failed to load meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeekDays = useCallback((): Date[] => {
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart);
            day.setDate(currentWeekStart.getDate() + i);
            days.push(day);
        }
        return days;
    }, [currentWeekStart]);

    const getMeetingsForDay = useCallback((date: Date): Meeting[] => {
        return meetings.filter(meeting => {
            if (meeting.status !== 'SCHEDULED') return false;
            return isSameDay(new Date(meeting.date), date);
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [meetings]);

    const previousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const nextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const goToToday = () => {
        setCurrentWeekStart(getStartOfWeek(new Date()));
    };

    const weekDays = getWeekDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    const weekLabel = t('meetings.weekLabel', {
        start: currentWeekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        end: weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    });

    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border p-12 flex items-center justify-center" role="status">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">{t('meetings.calendarLoading')}</span>
                </div>
            </div>
        );
    }

    return (
        <section
            aria-label={t('meetings.calendarAria')}
            className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
                        <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground leading-tight">{t('meetings.calendarTitle')}</h2>
                        <p className="text-xs text-muted-foreground" aria-live="polite">{weekLabel}</p>
                    </div>
                </div>

                <nav aria-label={t('meetings.calendarNavAria')} className="flex items-center gap-1.5">
                    <button
                        onClick={previousWeek}
                        aria-label={t('meetings.previousWeek')}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    >
                        <ChevronLeft className="w-4.5 h-4.5" aria-hidden="true" />
                    </button>
                    <button
                        onClick={goToToday}
                        aria-label={t('meetings.currentWeek')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    >
                        {t('meetings.today')}
                    </button>
                    <button
                        onClick={nextWeek}
                        aria-label={t('meetings.nextWeek')}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    >
                        <ChevronRight className="w-4.5 h-4.5" aria-hidden="true" />
                    </button>
                </nav>
            </div>

            {/* Calendar Grid */}
            <div
                className="grid grid-cols-1 md:grid-cols-7"
                role="grid"
                aria-label={t('meetings.weekDaysAria')}
            >
                {weekDays.map((day, index) => {
                    const dayMeetings = getMeetingsForDay(day);
                    const isToday = isSameDay(day, today);
                    const isPast = day < today && !isToday;
                    const dayFull = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(day);
                    const dayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day);
                    const dateNum = day.getDate();
                    const dayLabelDate = day.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
                    const dayAriaLabel = dayMeetings.length === 1
                        ? t('meetings.weekdayAriaOne', { day: dayFull, date: dayLabelDate, today: isToday ? t('meetings.todayLabel') : '' })
                        : t('meetings.weekdayAriaMany', {
                            day: dayFull,
                            date: dayLabelDate,
                            count: dayMeetings.length,
                            today: isToday ? t('meetings.todayLabel') : ''
                        });

                    return (
                        <div
                            key={index}
                            role="gridcell"
                            aria-label={dayAriaLabel}
                            className={`min-h-[180px] flex flex-col border-b md:border-b-0 md:border-r last:border-r-0 border-border/60 transition-colors ${
                                isPast ? 'bg-muted/20' : 'bg-card'
                            } ${isToday ? 'bg-primary/[0.03]' : ''}`}
                        >
                            {/* Day Header */}
                            <div
                                className={`flex items-center gap-2 px-3 py-2.5 border-b border-border/50 ${
                                    isToday ? 'bg-primary/[0.06]' : ''
                                }`}
                            >
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    {dayShort}
                                </span>
                                <span
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold leading-none ${
                                        isToday
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-foreground'
                                    }`}
                                    aria-current={isToday ? 'date' : undefined}
                                >
                                    {dateNum}
                                </span>
                                {dayMeetings.length > 0 && (
                                    <span
                                        className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                                        aria-hidden="true"
                                    >
                                        {dayMeetings.length}
                                    </span>
                                )}
                            </div>

                            {/* Meetings List */}
                            <div className="flex-1 p-1.5 space-y-1.5" role="list">
                                {dayMeetings.length === 0 ? (
                                    <div className="flex items-center justify-center h-full min-h-[80px]" aria-hidden="true">
                                        <span className="text-[11px] text-muted-foreground/50">—</span>
                                    </div>
                                ) : (
                                    dayMeetings.map(meeting => {
                                        const meetingTime = new Date(meeting.date);
                                        const timeStr = meetingTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                                        let participantCount = 0;
                                        try {
                                            const parts = JSON.parse(meeting.participants || '[]');
                                            participantCount = Array.isArray(parts) ? parts.length : 0;
                                        } catch { /* ignore */ }

                                        const meetingAriaLabel = participantCount === 1
                                            ? t('meetings.calendarMeetingAriaOne', { title: meeting.title, time: timeStr })
                                            : t('meetings.calendarMeetingAriaMany', { title: meeting.title, time: timeStr, count: participantCount });

                                        return (
                                            <Link
                                                key={meeting.id}
                                                to={`/meetings/${meeting.id}`}
                                                role="listitem"
                                                aria-label={meetingAriaLabel}
                                                className="group block px-2.5 py-2 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="shrink-0 mt-0.5 text-[11px] font-mono font-semibold text-primary tabular-nums" aria-hidden="true">
                                                        {timeStr}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                                            {meeting.title}
                                                        </p>
                                                        {participantCount > 0 && (
                                                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                                                                <Users className="w-3 h-3" aria-hidden="true" />
                                                                {participantCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
