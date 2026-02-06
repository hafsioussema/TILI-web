import type { User } from '@/types';
import { UserRole, UserStatus } from '@/types';
import { Edit2, Trash2, Shield, MoreHorizontal, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (user: User) => void;
}

export const UserCard = ({ user, onEdit, onDelete, onToggleStatus }: UserCardProps) => {
    const isActive = user.statut === UserStatus.ACTIVE;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-card border border-border hover:border-ring/50 rounded-xl p-5 hover:bg-secondary/20 transition-all duration-300 shadow-sm hover:shadow-md"
        >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="p-1 rounded bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition outline-none">
                            <MoreHorizontal size={16} />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="min-w-[140px] bg-popover rounded-lg shadow-xl p-1 border border-border z-50 animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenu.Item
                            onClick={() => onEdit(user)}
                            className="flex items-center px-2 py-1.5 text-xs text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                        >
                            <Edit2 size={12} className="mr-2" /> Edit Details
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            onClick={() => onToggleStatus(user)}
                            className="flex items-center px-2 py-1.5 text-xs text-popover-foreground rounded hover:bg-muted cursor-pointer outline-none transition-colors"
                        >
                            <Shield size={12} className="mr-2" /> {isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-border my-1" />
                        <DropdownMenu.Item
                            onClick={() => onDelete(user.id)}
                            className="flex items-center px-2 py-1.5 text-xs text-destructive rounded hover:bg-destructive/10 cursor-pointer outline-none transition-colors"
                        >
                            <Trash2 size={12} className="mr-2" /> Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>

            <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-b from-secondary to-muted border border-border flex items-center justify-center text-sm font-bold text-foreground shadow-inner">
                        {user.photo ? (
                            <img src={user.photo} alt={user.nom} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <span>{user.prenom[0]}{user.nom[0]}</span>
                        )}
                    </div>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background", isActive ? "bg-emerald-500" : "bg-destructive")} />
                </div>

                <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-foreground truncate">{user.prenom} {user.nom}</h3>
                    <p className="text-xs text-primary font-medium truncate mt-0.5">{user.poste || 'Member'}</p>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <Mail size={12} />
                    <span className="truncate">{user.email}</span>
                </div>
                {user.telephone && (
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                        <Phone size={12} />
                        <span className="truncate">{user.telephone}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider",
                    user.role === UserRole.ADMIN ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
                        user.role === UserRole.CHEF_PROJET ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                            "bg-secondary text-muted-foreground border-border"
                )}>
                    {user.role.replace('_', ' ')}
                </span>
            </div>
        </motion.div>
    );
};
