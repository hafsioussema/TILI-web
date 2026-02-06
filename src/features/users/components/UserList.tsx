import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import type { User } from '@/types';
import { UserRole, UserStatus } from '@/types';
import { UserPlus, Search, SlidersHorizontal } from 'lucide-react';
import { UserForm } from './UserForm';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { UserCard } from './UserCard';
import { motion, AnimatePresence } from 'framer-motion';

export const UserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const currentUser = useAuthStore((state) => state.user);
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            const data = await userService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user permanently?')) {
            await userService.delete(id);
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.statut === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
        setUsers(users.map(u => u.id === user.id ? { ...u, statut: newStatus } : u));
        await userService.updateStatus(user.id, newStatus);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(undefined);
        setIsModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchUsers();
    };

    const filteredUsers = users.filter(user =>
        user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full bg-secondary/50 text-foreground pl-10 pr-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder-muted-foreground text-sm"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-sm font-medium">
                        <SlidersHorizontal size={16} />
                        Filter
                    </button>
                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/10 transition-all text-sm font-bold"
                        >
                            <UserPlus size={16} />
                            Add Member
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Grid Content */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full border-2 border-muted opacity-50"></div>
                        <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <AnimatePresence>
                        {filteredUsers.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Slide-over Form Container (Replacing Modal) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl z-10"
                        >
                            <UserForm user={editingUser} onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
