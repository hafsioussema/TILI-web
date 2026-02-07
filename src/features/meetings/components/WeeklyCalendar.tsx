import React, { useEffect, useState } from 'react';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
        return <div className="flex justify-center py-12">Chargement du calendrier...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Planning de la semaine</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={previousWeek}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        Aujourd'hui
                    </button>
                    <button
                        onClick={nextWeek}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-slate-200">
                {weekDays.map((day, index) => {
                    const dayMeetings = getMeetingsForDay(day);
                    const isToday = day.getTime() === today.getTime();
                    const isPast = day < today;

                    return (
                        <div
                            key={index}
                            className={`min-h-[200px] ${isPast && !isToday ? 'bg-slate-50' : 'bg-white'}`}
                        >
                            {/* Day Header */}
                            <div className={`p-3 border-b border-slate-200 ${isToday ? 'bg-blue-50' : ''}`}>
                                <div className="text-xs font-medium text-slate-500 uppercase">
                                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                                    {day.getDate()}
                                </div>
                            </div>

                            {/* Meetings */}
                            <div className="p-2 space-y-2">
                                {dayMeetings.length === 0 ? (
                                    <div className="text-xs text-slate-400 text-center py-4">
                                        Aucune réunion
                                    </div>
                                ) : (
                                    dayMeetings.map(meeting => {
                                        const meetingTime = new Date(meeting.date);
                                        const statusColors = {
                                            SCHEDULED: 'bg-blue-100 border-blue-300 text-blue-700',
                                            UPLOADED: 'bg-slate-100 border-slate-300 text-slate-700',
                                            PROCESSING: 'bg-yellow-100 border-yellow-300 text-yellow-700',
                                            COMPLETED: 'bg-green-100 border-green-300 text-green-700',
                                            FAILED: 'bg-red-100 border-red-300 text-red-700',
                                        };

                                        return (
                                            <Link
                                                key={meeting.id}
                                                to={`/meetings/${meeting.id}`}
                                                className={`block p-2 rounded-lg border-l-4 ${statusColors[meeting.status]} hover:shadow-md transition-shadow`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium truncate">
                                                            {meetingTime.toLocaleTimeString('fr-FR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        <div className="text-xs font-semibold truncate mt-0.5">
                                                            {meeting.title}
                                                        </div>
                                                        {meeting.participants && (() => {
                                                            try {
                                                                const parts = JSON.parse(meeting.participants) as string[];
                                                                return (
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <Users className="w-3 h-3" />
                                                                        <span className="text-[10px]">
                                                                            {Array.isArray(parts) ? parts.length : 0}
                                                                        </span>
                                                                    </div>
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
