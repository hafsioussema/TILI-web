
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
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
                <Link
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer block"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileAudio className="w-5 h-5 text-blue-600" />
                        </div>
                        <StatusBadge status={meeting.status} />
                    </div>

                    <h3 className="font-semibold text-slate-800 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                        {meeting.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(meeting.createdAt).toLocaleDateString()}
                        </div>
                        {/* Duration could be added if available from backend */}
                    </div>
                </Link>
            ))}

            {meetings.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileAudio className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm">Aucun enregistrement ou analyse disponible.</p>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: Meeting['status'] }) => {
    const styles = {
        SCHEDULED: 'bg-blue-100 text-blue-700',
        UPLOADED: 'bg-slate-100 text-slate-600',
        PROCESSING: 'bg-yellow-100 text-yellow-700 animate-pulse',
        COMPLETED: 'bg-green-100 text-green-700',
        FAILED: 'bg-red-100 text-red-700'
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
