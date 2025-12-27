import React, { useState } from 'react';
import { Stage2Shot } from '../../types/stage2.types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ShotAccordionProps {
    shot: Stage2Shot;
    is2A: boolean;
    onUpdate: (updatedShot: Stage2Shot) => void;
}

export const ShotAccordion: React.FC<ShotAccordionProps> = ({ shot, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFreeInput = (value: string) => {
        onUpdate({ ...shot, freeInput: value });
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'new': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 whitespace-nowrap">신규 추가</span>;
            case 'split': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 whitespace-nowrap">분할</span>;
            case 'split-added': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 whitespace-nowrap">분할 추가</span>;
            case 'merged': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 whitespace-nowrap">병합</span>;
            default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-500 whitespace-nowrap">변경 없음</span>;
        }
    };

    // Camera Info Helper
    const hasCamera = !!shot.camera_movement;
    const camType = shot.camera_movement?.type || '-';
    const camSpeed = shot.camera_movement?.speed;
    const camDur = shot.camera_movement?.duration;

    return (
        <div className={`border-b border-border-color last:border-b-0 transition-colors
            ${isExpanded ? 'bg-bg-secondary/30' : 'bg-transparent hover:bg-bg-tertiary/10'}
        `}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer gap-4 group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex gap-4 flex-1 items-center">
                    <span className="text-xs font-bold text-text-secondary w-[60px] shrink-0">{shot.shot_id}</span>

                    <div className="w-[80px] shrink-0 flex justify-center">
                        {getStatusBadge(shot.updateStatus)}
                    </div>

                    <p className="text-sm text-text-primary/90 leading-relaxed line-clamp-2 w-full">
                        {shot.shot_text}
                    </p>
                </div>
                <div className="text-text-secondary group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Expanded Body */}
            {isExpanded && (
                <div className="px-4 pb-4 pl-[102px] space-y-4">

                    {/* 1. Camera Movement Info (Read Only) */}
                    <div className="bg-bg-tertiary/30 border border-border-color/30 rounded-lg p-3">
                        <div className="text-[10px] font-bold text-text-secondary uppercase mb-2">Camera Movement</div>
                        {hasCamera ? (
                            <div className="flex gap-6 text-xs text-text-primary/80">
                                <div>
                                    <span className="text-text-secondary mr-2">Type:</span>
                                    <span className="font-medium text-white">{camType}</span>
                                </div>
                                {camSpeed && (
                                    <div>
                                        <span className="text-text-secondary mr-2">Speed:</span>
                                        <span className="font-medium text-white">{camSpeed}</span>
                                    </div>
                                )}
                                {camDur && (
                                    <div>
                                        <span className="text-text-secondary mr-2">Duration:</span>
                                        <span className="font-medium text-white">{camDur?.endsWith('s') ? camDur : `${camDur}s`}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-text-secondary/50 italic">
                                No camera information (New or Empty)
                            </div>
                        )}
                    </div>

                    {/* 2. Correction Request (Free Input) */}
                    <div>
                        <div className="text-[10px] font-bold text-accent-blue uppercase mb-2">Correction Request (Optional)</div>
                        <textarea
                            className="w-full p-3 rounded-xl bg-bg-primary border border-border-color 
                                focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20
                                text-sm leading-relaxed placeholder:text-text-secondary/30 min-h-[80px] resize-y"
                            placeholder="Enter specific modification requests here..."
                            value={shot.freeInput || ''}
                            onChange={(e) => handleFreeInput(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
