
import React, { useEffect, useState } from 'react';
import { meetingService } from '../services/meetingService';
import type { Meeting } from '../types';
import { FileAudio, Calendar, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const MeetingList: React.FC = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
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
            <div className="flex justify-center py-12" role="status" aria-label={t('meetings.loading')}>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            role="list"
            aria-label={t('meetings.listAria')}
        >
            {meetings.map((meeting) => (
                <Link
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    role="listitem"
                    className="group bg-card rounded-2xl border border-border/80 p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
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
                            {new Date(meeting.createdAt).toLocaleDateString(locale)}
                        </div>
                    </div>
                </Link>
            ))}

            {meetings.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/40 rounded-2xl border border-dashed border-border/70">
                    <FileAudio className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
                    <p className="text-sm">{t('meetings.emptyRecordings')}</p>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: Meeting['status'] }) => {
    const { t } = useTranslation('common');
    const styles = {
        SCHEDULED: 'bg-accent text-accent-foreground border border-border',
        UPLOADED: 'bg-muted text-muted-foreground border border-border',
        PROCESSING: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60 animate-pulse',
        COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60',
        FAILED: 'bg-destructive/10 text-destructive border border-destructive/20'
    };

    const labels = {
        SCHEDULED: t('meetings.status.scheduled'),
        UPLOADED: t('meetings.status.uploaded'),
        PROCESSING: t('meetings.status.processing'),
        COMPLETED: t('meetings.status.completed'),
        FAILED: t('meetings.status.failed')
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};
