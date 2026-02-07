
import React, { useEffect, useState } from 'react';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types';
import { FileAudio, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MeetingList: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const data = await meetingService.getAllMeetings();
            // Filter out SCHEDULED meetings - only show recordings/analyses
            const recordingsOnly = data.filter(m => m.status !== 'SCHEDULED');
            setMeetings(recordingsOnly);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
                <Link
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    className="group bg-card rounded-2xl border border-border/80 p-5 hover:shadow-md transition-shadow cursor-pointer block"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <FileAudio className="w-5 h-5 text-primary" />
                        </div>
                        <StatusBadge status={meeting.status} />
                    </div>

                    <h3 className="font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                        {meeting.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(meeting.createdAt).toLocaleDateString()}
                        </div>
                        {/* Duration could be added if available from backend */}
                    </div>
                </Link>
            ))}

            {meetings.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/40 rounded-2xl border border-dashed border-border/70">
                    <FileAudio className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
                    <p className="text-sm">Aucun enregistrement ou analyse disponible.</p>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: Meeting['status'] }) => {
    const styles = {
        SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/60',
        UPLOADED: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800',
        PROCESSING: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60 animate-pulse',
        COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60',
        FAILED: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60'
    };

    const labels = {
        SCHEDULED: 'Scheduled',
        UPLOADED: 'Uploaded',
        PROCESSING: 'Processing AI',
        COMPLETED: 'Ready',
        FAILED: 'Failed'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};
