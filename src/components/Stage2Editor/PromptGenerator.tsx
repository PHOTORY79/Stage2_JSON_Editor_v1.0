import React from 'react';
import { Stage2Shot } from '../../types/stage2.types';
import { Copy, Wand2, Sparkles } from 'lucide-react';

interface PromptGeneratorProps {
    shots: Stage2Shot[];
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ shots }) => {

    // Logic: Only include shots that have been Modified (have freeInput)
    // If no specific "Request" field exists anymore, we just use the freeInput content.
    const modifiedShots = shots.filter(s => s.freeInput && s.freeInput.trim() !== '');

    const generateDisplayItems = () => {
        if (modifiedShots.length === 0) return [];
        return modifiedShots.map(shot => ({
            id: shot.shot_id,
            content: shot.freeInput || ''
        }));
    };

    // For copying: simpler format
    const generateCopyText = () => {
        return modifiedShots.map(shot => `[${shot.shot_id}] ${shot.freeInput}`).join('\n\n');
    };

    const displayItems = generateDisplayItems();
    const copyText = generateCopyText();

    const handleCopy = () => {
        if (!copyText) return;
        navigator.clipboard.writeText(copyText);
        alert(`Copied ${modifiedShots.length} modified shots to clipboard.`);
    };

    return (
        <div className="bg-bg-secondary border border-border-color rounded-2xl shadow-lg ring-1 ring-white/5 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-color bg-gradient-to-r from-bg-secondary to-bg-tertiary">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-accent-pink to-accent-orange rounded-lg shadow-lg shadow-accent-pink/20">
                        <Wand2 size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Final Prompt Preview</h3>
                        <p className="text-[10px] text-text-secondary">Includes only modified shots ({modifiedShots.length})</p>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    disabled={modifiedShots.length === 0}
                    className="btn btn-sm bg-white text-bg-primary hover:bg-gray-100 border-none gap-2 font-bold shadow-lg disabled:opacity-50 disabled:shadow-none"
                >
                    <Copy size={14} />
                    Copy Changes
                </button>
            </div>

            {/* Content Preview */}
            <div className="p-5 max-h-48 overflow-y-auto custom-scrollbar bg-bg-primary/50">
                {displayItems.length > 0 ? (
                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-text-secondary uppercase mb-2">Preview</div>
                        {displayItems.map((item, idx) => (
                            <div key={idx} className="flex gap-3 text-sm p-3 rounded-xl bg-bg-secondary border border-border-color/50 items-start">
                                <span className="font-mono text-accent-pink font-bold text-xs mt-0.5">{item.id}</span>
                                <span className="text-text-primary/90 leading-relaxed">{item.content}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-text-secondary/40 gap-2">
                        <Sparkles size={24} className="opacity-20" />
                        <span className="text-xs">No modifications yet. Edit shots to generate a prompt.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
