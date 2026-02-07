import { ProjectStatus } from '@/types/documents';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectFiltersProps {
    statusFilter: 'all' | ProjectStatus;
    onStatusChange: (status: 'all' | ProjectStatus) => void;
}

export const ProjectFilters = ({
    statusFilter,
    onStatusChange
}: ProjectFiltersProps) => {
    const activeCount = statusFilter !== 'all' ? 1 : 0;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all text-sm font-medium outline-none",
                    activeCount > 0
                        ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}>
                    <Filter size={16} />
                    Filtres
                    {activeCount > 0 && (
                        <span className="flex items-center justify-center bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full ml-1 font-bold">
                            {activeCount}
                        </span>
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" className="min-w-[200px] bg-popover rounded-xl shadow-xl border border-border p-2 z-50 animate-in fade-in zoom-in-95 duration-200">

                    <DropdownMenu.Label className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Statut du Projet
                    </DropdownMenu.Label>

                    <DropdownMenu.RadioGroup value={statusFilter} onValueChange={(val: string) => onStatusChange(val as any)}>
                        {[
                            { val: 'all', label: 'Tous les projets' },
                            { val: ProjectStatus.ACTIVE, label: 'Actifs uniquement' },
                            { val: ProjectStatus.COMPLETED, label: 'Terminés uniquement' },
                            { val: ProjectStatus.ARCHIVED, label: 'Archivés uniquement' }
                        ].map((item) => (
                            <DropdownMenu.RadioItem
                                key={item.val}
                                value={item.val}
                                className="flex items-center px-2 py-2 text-sm rounded-lg hover:bg-secondary cursor-pointer outline-none transition-colors mb-0.5"
                            >
                                <span className={cn(
                                    "flex items-center justify-center w-4 h-4 mr-2 rounded-full border",
                                    statusFilter === item.val ? "border-primary bg-primary" : "border-muted-foreground"
                                )}>
                                    {statusFilter === item.val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </span>
                                {item.label}
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>

                    {activeCount > 0 && (
                        <>
                            <DropdownMenu.Separator className="h-px bg-border my-2" />
                            <DropdownMenu.Item
                                onClick={() => onStatusChange('all')}
                                className="flex items-center justify-center px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
                            >
                                Réinitialiser les filtres
                            </DropdownMenu.Item>
                        </>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
