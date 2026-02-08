import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { FileText, Download, Eye, FileSpreadsheet, FileImage } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { useTranslation } from 'react-i18next';

const documents = [
    { name: "Project Requirements.pdf", type: "PDF", size: "2.4 MB", author: "Sarah K.", date: "Feb 10, 2026", icon: FileText, color: "text-red-500", bg: "bg-red-500/10" },
    { name: "Q1 Financial Overview.xlsx", type: "Spreadsheet", size: "1.8 MB", author: "Mike J.", date: "Feb 08, 2026", icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-500/10" },
    { name: "Homepage Mockup v2.png", type: "Image", size: "4.5 MB", author: "Alex M.", date: "Feb 05, 2026", icon: FileImage, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Meeting Notes - Kickoff", type: "Doc", size: "156 KB", author: "Emily R.", date: "Jan 28, 2026", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
];

export const DocumentList = () => {
    const { t } = useTranslation('common');
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">{t('components.documentList.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('components.documentList.subtitle')}</p>
                </div>
                <PremiumButton>{t('components.documentList.uploadButton')}</PremiumButton>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {documents.map((doc, index) => (
                    <AnimatedCard
                        key={index}
                        className="group relative overflow-hidden"
                        whileHover={{ y: -5 }}
                    >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button className="p-1.5 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors">
                                <Eye size={14} />
                            </button>
                            <button className="p-1.5 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors">
                                <Download size={14} />
                            </button>
                        </div>

                        <div className={`w-12 h-12 rounded-lg ${doc.bg} ${doc.color} flex items-center justify-center mb-4`}>
                            <doc.icon size={24} />
                        </div>

                        <h3 className="font-semibold text-foreground truncate" title={doc.name}>{doc.name}</h3>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{doc.size}</span>
                            <span>{doc.type}</span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Added by <span className="text-foreground font-medium">{doc.author}</span></span>
                            <span className="text-muted-foreground/70">{doc.date}</span>
                        </div>
                    </AnimatedCard>
                ))}
            </div>
        </div>
    );
};
