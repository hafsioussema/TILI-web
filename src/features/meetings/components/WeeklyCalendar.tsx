import React, { useEffect, useState } from 'react';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, CheckCircle2, UploadCloud, AlertTriangle, XCircle, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WeeklyCalendar: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
    const [loading, setLoading] = useState(true);

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

    function getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
        return new Date(d.setDate(diff));
    }

    const getWeekDays = (): Date[] => {
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart);
            day.setDate(currentWeekStart.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const getMeetingsForDay = (date: Date): Meeting[] => {
        return meetings.filter(meeting => {
            // Only show SCHEDULED meetings in the weekly calendar
            if (meeting.status !== 'SCHEDULED') {
                return false;
            }

            const meetingDate = new Date(meeting.date);
            return (
                meetingDate.getDate() === date.getDate() &&
                meetingDate.getMonth() === date.getMonth() &&
                meetingDate.getFullYear() === date.getFullYear()
            );
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

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

    if (loading) {
        return <div className="flex justify-center py-12 text-muted-foreground">Chargement du calendrier...</div>;
    }

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border/80 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-cyan-500 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-primary-foreground" />
                    <h2 className="text-xl font-bold text-primary-foreground">Planning de la semaine</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={previousWeek}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-primary-foreground" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-primary-foreground text-sm font-medium transition-colors"
                    >
                        Aujourd'hui
                    </button>
                    <button
                        onClick={nextWeek}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-primary-foreground" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-border/70">
                {weekDays.map((day, index) => {
                    const dayMeetings = getMeetingsForDay(day);
                    const isToday = day.getTime() === today.getTime();
                    const isPast = day < today;

                    return (
                        <div
                            key={index}
                            className={`min-h-[200px] ${isPast && !isToday ? 'bg-muted/40' : 'bg-card'}`}
                        >
                            {/* Day Header */}
                            <div className={`p-3 border-b border-border/70 ${isToday ? 'bg-primary/10' : ''}`}>
                                <div className="text-xs font-medium text-muted-foreground uppercase">
                                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                    {day.getDate()}
                                </div>
                            </div>

                            {/* Meetings */}
                            <div className="p-2 space-y-2">
                                {dayMeetings.length === 0 ? (
                                    <div className="text-xs text-muted-foreground text-center py-4">
                                        Aucune réunion
                                    </div>
                                ) : (
                                    dayMeetings.map(meeting => {
                                        const meetingTime = new Date(meeting.date);
                                        const statusStyles = {
                                            SCHEDULED: {
                                                border: 'border-blue-600/80',
                                                chip: 'bg-blue-700 text-white border-blue-700',
                                                label: 'Planifiee',
                                                icon: Calendar,
                                            },
                                            UPLOADED: {
                                                border: 'border-slate-600/80',
                                                chip: 'bg-slate-800 text-white border-slate-800',
                                                label: 'Enregistree',
                                                icon: UploadCloud,
                                            },
                                            PROCESSING: {
                                                border: 'border-amber-600/80',
                                                chip: 'bg-amber-700 text-white border-amber-700',
                                                label: 'Analyse',
                                                icon: Timer,
                                            },
                                            COMPLETED: {
                                                border: 'border-emerald-700/80',
                                                chip: 'bg-emerald-700 text-white border-emerald-700',
                                                label: 'Terminee',
                                                icon: CheckCircle2,
                                            },
                                            FAILED: {
                                                border: 'border-red-700/80',
                                                chip: 'bg-red-700 text-white border-red-700',
                                                label: 'Echec',
                                                icon: XCircle,
                                            },
                                        };

                                        const statusMeta = statusStyles[meeting.status];
                                        const StatusIcon = statusMeta.icon;
                                        const meetingLabel = `${meeting.title}. ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Statut ${statusMeta.label}.`;

                                        return (
                                            <Link
                                                key={meeting.id}
                                                to={`/meetings/${meeting.id}`}
                                                className={`block p-3.5 rounded-xl border-l-4 bg-card text-foreground border ${statusMeta.border} hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40`}
                                                aria-label={meetingLabel}
                                            >
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Clock className="w-4 h-4" aria-hidden="true" />
                                                        <span>
                                                            {meetingTime.toLocaleTimeString('fr-FR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="text-base font-semibold leading-snug line-clamp-2">
                                                        {meeting.title}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.chip}`}>
                                                            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                                            {statusMeta.label}
                                                        </span>
                                                        {meeting.participants && (() => {
                                                            try {
                                                                const parts = JSON.parse(meeting.participants) as string[];
                                                                const count = Array.isArray(parts) ? parts.length : 0;
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                                                                        {count}
                                                                    </span>
                                                                );
                                                            } catch {
                                                                return null;
                                                            }
                                                        })()}
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
        </div>
    );
};
