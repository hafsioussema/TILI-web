import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, Clock, Users, X, Loader2 } from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { toast } from 'sonner';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [participantsStr, setParticipantsStr] = useState('');
  const [minPresenceDuration, setMinPresenceDuration] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const participants = participantsStr
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      // Combine date and time into ISO string
      const dateTime = new Date(`${date}T${time}`).toISOString();

      await meetingService.createMeeting({
        title: title || 'New Meeting',
        date: dateTime,
        participants,
        minPresenceDuration: parseInt(minPresenceDuration) || 0,
      });

      toast.success('Meeting scheduled successfully');

      // Reset form
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('14:00');
      setParticipantsStr('');
      setMinPresenceDuration('0');

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <Dialog.Title className="text-xl font-bold text-slate-900">
              Schedule a Meeting
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Team Standup"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Clock size={16} />
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Users size={16} />
                Participants (comma-separated emails)
              </label>
              <textarea
                value={participantsStr}
                onChange={(e) => setParticipantsStr(e.target.value)}
                placeholder="alice@example.com, bob@example.com"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Min Presence Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Presence Duration (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={minPresenceDuration}
                onChange={(e) => setMinPresenceDuration(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Participants need to stay for this duration to be marked as present
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
