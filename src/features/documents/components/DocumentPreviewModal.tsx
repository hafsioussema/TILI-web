import { useState, useEffect } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import { type TiliDocument } from '@/types/documents';
import { documentService } from '../documentService';
import { toast } from 'sonner';

const PDF_TYPES = ['application/pdf'];

interface DocumentPreviewModalProps {
    document: TiliDocument;
    onClose: () => void;
}

export const DocumentPreviewModal = ({ document: doc, onClose }: DocumentPreviewModalProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mime = (doc.mimeType || '').toLowerCase();
    const canPreview = () =>
        PDF_TYPES.some((t) => mime.includes(t)) || mime.startsWith('image/');
    const isPdf = () => mime.includes('pdf');
    const isImage = () => mime.startsWith('image/');

    useEffect(() => {
        let objectUrl: string | null = null;

        const load = async () => {
            if (!canPreview()) {
                setError('Aperçu non disponible pour ce type de fichier.');
                setIsLoading(false);
                return;
            }
            try {
                const blob = await documentService.getPreviewBlob(doc._id);
                objectUrl = URL.createObjectURL(blob);
                setPreviewUrl(objectUrl);
                setError(null);
            } catch (err) {
                console.error('Preview failed:', err);
                setError('Impossible de charger l’aperçu.');
                toast.error('Erreur lors du chargement de l’aperçu');
            } finally {
                setIsLoading(false);
            }
        };

        load();
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [doc._id]);

    const handleDownload = async () => {
        try {
            await documentService.download(doc._id, doc.name);
            toast.success('Téléchargement démarré');
        } catch {
            toast.error('Erreur lors du téléchargement');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Aperçu du document"
        >
            <div
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <h2 className="font-semibold text-foreground truncate">{doc.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Télécharger"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-secondary hover:bg-destructive/20 hover:text-destructive transition-colors"
                            title="Fermer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 p-4 overflow-auto">
                    {isLoading && (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-10 w-10 animate-spin" />
                            <span className="text-sm">Chargement de l’aperçu...</span>
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                            >
                                <Download className="h-4 w-4" /> Télécharger le fichier
                            </button>
                        </div>
                    )}

                    {!isLoading && previewUrl && !error && (
                        <>
                            {isPdf() && (
                                <iframe
                                    src={previewUrl}
                                    title={doc.name}
                                    className="w-full h-full min-h-[70vh] rounded-lg border border-border bg-white"
                                />
                            )}
                            {isImage() && !isPdf() && (
                                <img
                                    src={previewUrl}
                                    alt={doc.name}
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
