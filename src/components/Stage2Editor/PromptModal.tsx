import React, { useMemo } from 'react';
import { Stage2Shot, Stage2Scene } from '../../types/stage2.types';
import { Copy, X, FileText, Info } from 'lucide-react';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentShots: Stage2Shot[];
    originalShots: Stage2Shot[]; // To detect changes
    sceneTitle: string;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, currentShots, originalShots, sceneTitle }) => {
    if (!isOpen) return null;

    const modifiedShots = useMemo(() => {
        return currentShots.filter(s => !!s.freeInput);
    }, [currentShots]);

    // Generate Full Prompt Text
    const fullPromptText = useMemo(() => {
        const header = `# Scene Direction Update Request\n\n`;
        const intro = `Please generate the visual direction for Scene ${sceneTitle} based on the following updated shot list and specific modification requests.\n\n`;

        const listHeader = `## Updated Shot List\n`;
        const list = currentShots.map(s => {
            let statusTag = '';
            if (s.updateStatus === 'new') statusTag = ' [New]';
            if (s.updateStatus === 'split') statusTag = ' [Split]';
            if (s.updateStatus === 'split-added') statusTag = ' [Split Added]';
            if (s.updateStatus === 'merged') statusTag = ' [Merged]';

            return `${s.shot_id}:${statusTag} ${s.shot_text}`;
        }).join('\n');

        const requestsHeader = `\n\n## Specific Modification Requests\n`;
        const requests = modifiedShots.map(s => {
            return `${s.shot_id}: ${s.freeInput}`;
        }).join('\n');

        return header + intro + listHeader + list + (modifiedShots.length > 0 ? requestsHeader + requests : '');
    }, [currentShots, modifiedShots, sceneTitle]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullPromptText);
        alert('Prompt copied!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-bg-secondary w-[800px] h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-bg-secondary to-bg-tertiary">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-purple/10 rounded-lg">
                            <FileText size={20} className="text-accent-purple" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Correction Request</h3>
                            <p className="text-xs text-text-secondary">Generate final prompt for valid modifications</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="btn btn-sm btn-ghost btn-square text-accent-blue hover:bg-accent-blue/10 hover:text-accent-blue"
                            title="Copy All"
                        >
                            <Copy size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-ghost btn-circle text-text-secondary hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 font-mono text-sm leading-relaxed space-y-8 bg-black/20">

                    {/* Guidance Text */}
                    <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 flex gap-3">
                        <Info size={18} className="text-accent-blue shrink-0 mt-0.5" />
                        <p className="text-xs text-text-primary/80 leading-relaxed">
                            아래 변경된 샷 분할과 샷별 요청사항을 반영하여 Stage 2 JSON의 샷 리스트 정보와 연출 정보를 업데이트해주세요.
                        </p>
                    </div>

                    {/* Section 1: Scene List */}
                    <div>
                        <h4 className="text-accent-blue font-bold border-b border-accent-blue/30 pb-2 mb-4 uppercase tracking-wider text-xs">
                            ■ Scene: {sceneTitle} (Current Shot List)
                        </h4>
                        <div className="space-y-2 text-text-primary/90">
                            {currentShots.map((shot, idx) => {
                                const isNew = idx >= originalShots.length;
                                const isMod = !!shot.freeInput;

                                return (
                                    <div key={idx} className="flex gap-4 border-b border-white/5 pb-1 last:border-0 hover:bg-white/5 px-2 rounded">
                                        <span className="font-bold text-text-secondary w-28 shrink-0">{shot.shot_id}</span>
                                        <span className="flex-1">
                                            {shot.shot_text}
                                            {isNew && <span className="ml-2 text-accent-green text-[10px] uppercase font-bold tracking-wider">[New]</span>}
                                            {isMod && <span className="ml-2 text-accent-blue text-[10px] uppercase font-bold tracking-wider">[Modified]</span>}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Requests */}
                    {modifiedShots.length > 0 && (
                        <div>
                            <h4 className="text-accent-pink font-bold border-b border-accent-pink/30 pb-2 mb-4 uppercase tracking-wider text-xs">
                                ■ Specific Modifications
                            </h4>
                            <div className="space-y-3">
                                {modifiedShots.map((shot, idx) => (
                                    <div key={idx} className="flex gap-4 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 px-2 rounded">
                                        <span className="font-bold text-text-secondary w-28 shrink-0">{shot.shot_id}</span>
                                        <span className="text-accent-pink flex-1">{shot.freeInput}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};
