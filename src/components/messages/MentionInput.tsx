import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { AtSign } from 'lucide-react';

interface Member {
    _id: string;
    nom: string;
    prenom: string;
    avatar?: string;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string, mentions: string[]) => void;
    onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
    members: Member[];
    placeholder?: string;
}

export function MentionInput({ 
    value, 
    onChange, 
    onKeyDown, 
    members, 
    placeholder 
}: MentionInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [mentionStart, setMentionStart] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Extraire les mentions actuelles
    const extractMentionIds = (text: string): string[] => {
        const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
        const ids: string[] = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            ids.push(match[2]);
        }
        return ids;
    };

    // Gérer l'input
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;
        
        // Chercher si on est en train de taper une mention
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            
            // Vérifier qu'il n'y a pas d'espace dans la partie après @
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionStart(lastAtIndex);
                const searchTerm = textAfterAt.toLowerCase();
                
                const filtered = members.filter(m => 
                    m.nom.toLowerCase().includes(searchTerm) ||
                    m.prenom.toLowerCase().includes(searchTerm) ||
                    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchTerm)
                );
                
                setFilteredMembers(filtered);
                setShowSuggestions(filtered.length > 0);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
        
        const mentionIds = extractMentionIds(newValue);
        onChange(newValue, mentionIds);
    };

    // Insérer une mention
    const insertMention = (member: Member) => {
        if (mentionStart === null) return;
        
        const cursorPos = textareaRef.current?.selectionStart || 0;
        const textBefore = value.slice(0, mentionStart);
        const textAfter = value.slice(cursorPos);
        
        const mentionText = `@[${member.prenom} ${member.nom}](${member._id})`;
        const newValue = `${textBefore}${mentionText} ${textAfter}`;
        
        const mentionIds = extractMentionIds(newValue);
        onChange(newValue, mentionIds);
        setShowSuggestions(false);
        
        // Focus et positionner le curseur après la mention
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = mentionStart + mentionText.length + 1;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                textareaRef.current.focus();
            }
        }, 0);
    };

    // Navigation dans les suggestions
    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredMembers.length - 1 ? prev + 1 : 0
                );
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev > 0 ? prev - 1 : filteredMembers.length - 1
                );
                return;
            }
            if (e.key === 'Enter' && filteredMembers[selectedIndex]) {
                e.preventDefault();
                insertMention(filteredMembers[selectedIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                return;
            }
        }
        
        onKeyDown?.(e);
    };

    // Fermer les suggestions en cliquant ailleurs
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Afficher le texte avec les mentions stylisées
    const renderDisplayValue = () => {
        const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
        return value.replace(mentionRegex, '@$1');
    };

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={renderDisplayValue()}
                onChange={handleInput}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                rows={2}
                className="w-full px-4 py-3 pr-10 text-sm border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 resize-none"
            />
            
            {/* Bouton mention */}
            <button
                type="button"
                onClick={() => {
                    if (textareaRef.current) {
                        const pos = textareaRef.current.selectionStart || value.length;
                        const newValue = value.slice(0, pos) + '@' + value.slice(pos);
                        const mentionIds = extractMentionIds(newValue);
                        onChange(newValue, mentionIds);
                        
                        setTimeout(() => {
                            textareaRef.current?.focus();
                            textareaRef.current?.setSelectionRange(pos + 1, pos + 1);
                        }, 0);
                    }
                }}
                className="absolute right-3 top-3 p-1.5 text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                title="Mentionner quelqu'un"
            >
                <AtSign className="w-4 h-4" />
            </button>

            {/* Suggestions */}
            {showSuggestions && (
                <div 
                    ref={suggestionsRef}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50"
                >
                    {filteredMembers.map((member, index) => (
                        <button
                            key={member._id}
                            onClick={() => insertMention(member)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                                index === selectedIndex ? 'bg-blue-50 dark:bg-blue-600/20' : ''
                            }`}
                        >
                            {member.avatar ? (
                                <img 
                                    src={member.avatar.startsWith('http') ? member.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${member.avatar}`}
                                    alt={member.prenom} 
                                    className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-200 dark:ring-slate-600"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-gray-200 dark:ring-slate-600">
                                    {member.prenom[0]}{member.nom[0]}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.prenom} {member.nom}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
