
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileAudio } from 'lucide-react';
import { meetingService } from '../services/meetingService';

interface MeetingUploadProps {
    onUploadComplete: () => void;
}

export const MeetingUpload: React.FC<MeetingUploadProps> = ({ onUploadComplete }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [participantsStr, setParticipantsStr] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/*': ['.mp3', '.wav', '.m4a'],
            'video/*': ['.mp4']
        },
        maxFiles: 1,
        multiple: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            // 1. Create Meeting
            const participants = participantsStr.split(',').map(p => p.trim()).filter(p => p);

            // Note: date should be ISO-8601 for backend
            const meeting = await meetingService.createMeeting({
                title: title || 'New Meeting',
                date: date,
                participants
            });

            // 2. Upload if file exists
            if (file) {
                await meetingService.uploadAudio(meeting.id, file, (p) => setProgress(p));
            }

            if (onUploadComplete) onUploadComplete();
        } catch (error) {
            console.error(error);
            alert('Failed to create meeting');
        } finally {
            setUploading(false);
            setProgress(0);
            setTitle('');
            setFile(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">New Meeting</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Weekly Team Sync"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Participants (comma separated emails)</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={participantsStr}
                        onChange={e => setParticipantsStr(e.target.value)}
                        placeholder="alice@tili.com, bob@tili.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Recording (Optional)</label>
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}>
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="flex items-center justify-center gap-2 text-blue-600">
                                <FileAudio className="w-5 h-5" />
                                <span className="font-medium text-sm">{file.name}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <Upload className="w-6 h-6" />
                                <p className="text-sm">Drag & drop recording here, or click to select</p>
                                <p className="text-xs text-slate-400">MP3, WAV, M4A, MP4</p>
                            </div>
                        )}
                    </div>
                </div>

                {uploading && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>{file ? 'Uploading & Processing...' : 'Creating Meeting...'}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {uploading ? 'Processing...' : (file ? 'Save & Upload' : 'Save Details Only')}
                </button>
            </form>
        </div>
    );
};
