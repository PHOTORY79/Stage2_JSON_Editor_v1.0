import React, { useState, useEffect } from 'react';
import { Stage2Scene, Stage2Shot } from '../../types/stage2.types';
import { ShotAccordion } from './ShotAccordion';
import { PromptModal } from './PromptModal';
import { FileText, Edit2, RotateCcw, Save, Wand2 } from 'lucide-react';

interface Stage2EditorProps {
    scene: Stage2Scene;
    step: 'shot_division_2A' | 'visual_direction_2B';
    onUpdate: (updatedScene: Stage2Scene) => void;
    onEditModeChange?: (isEditing: boolean) => void;
}

export const Stage2Editor: React.FC<Stage2EditorProps> = ({ scene, step, onUpdate, onEditModeChange }) => {

    const [shots, setShots] = useState<Stage2Shot[]>(scene.shots);
    const [initialShots, setInitialShots] = useState<Stage2Shot[]>(scene.shots);
    const [scenarioText, setScenarioText] = useState('');
    const [isEditingScenario, setIsEditingScenario] = useState(false);
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    // Sync from Props
    useEffect(() => {
        setShots(scene.shots);
        // Keep scenario text in sync if not editing
        if (!isEditingScenario) {
            setScenarioText(scene.shots.map(s => s.shot_text).join('\n'));
        }
    }, [scene]);

    // Track Original State for Reset (Updates only when switching scenes)
    useEffect(() => {
        setInitialShots(scene.shots);
    }, [scene.scene_id]);

    // Notify Parent about Edit Mode
    useEffect(() => {
        onEditModeChange?.(isEditingScenario);
    }, [isEditingScenario, onEditModeChange]);

    // Similarity Helper
    const getSimilarity = (s1: string, s2: string) => {
        if (!s1 || !s2) return 0;
        const clean = (s: string) => s.toLowerCase().replace(/[.,!?]/g, '').trim();
        const w1 = clean(s1).split(/\s+/);
        const w2 = clean(s2).split(/\s+/);
        const intersection = w1.filter(x => w2.includes(x));
        if (w1.length + w2.length === 0) return 0;
        return (intersection.length * 2) / (w1.length + w2.length);
    };

    const handleShotUpdate = (updatedShot: Stage2Shot) => {
        const newShots = shots.map(s => s.shot_id === updatedShot.shot_id ? updatedShot : s);
        setShots(newShots);
        onUpdate({ ...scene, shots: newShots });
    };

    const toggleEditMode = () => {
        if (isEditingScenario) {
            // APPLY CHANGES
            const lines = scenarioText.split(/\r?\n/).filter(line => line.trim().length > 0);

            // 1. Calculate Matches
            const lineMatches = lines.map((line, idx) => {
                const shotId = `${scene.scene_id}.${String(idx + 1).padStart(2, '0')}`;

                const cleanLine = line.toLowerCase().replace(/[.,!?]/g, '').trim();

                const matched = shots.filter(old => {
                    const cleanOld = old.shot_text.toLowerCase().replace(/[.,!?]/g, '').trim();
                    // Substring check (if line is part of old shot)
                    if (cleanLine.length > 2 && cleanOld.includes(cleanLine)) return true;
                    // Reverse Substring check (if old shot is part of line - e.g. added text to line)
                    if (cleanOld.length > 2 && cleanLine.includes(cleanOld)) return true;
                    // Similarity check
                    return getSimilarity(line, old.shot_text) > 0.3;
                });

                matched.sort((a, b) => getSimilarity(line, b.shot_text) - getSimilarity(line, a.shot_text));
                return { line, shotId, matched };
            });

            // 2. Count Old Shot Usage (Global)
            const usageCount = new Map<string, number>();
            lineMatches.forEach(lm => {
                lm.matched.forEach(m => {
                    usageCount.set(m.shot_id, (usageCount.get(m.shot_id) || 0) + 1);
                });
            });

            // Track matches seen so far to distinguish First vs Subsequent in a Split
            const oldShotSeenCounter = new Map<string, number>();


            // 3. Construct New Shots
            const newShots: Stage2Shot[] = lineMatches.map(lm => {
                let status: 'new' | 'split' | 'split-added' | 'merged' | 'none' = 'none';
                let baseShot = lm.matched[0];
                let cameraInfo = baseShot?.camera_movement;

                if (lm.matched.length === 0) {
                    status = 'new';
                } else if (lm.matched.length > 1) {
                    status = 'merged';
                    // Merge Metadata
                    const types = lm.matched.map(s => s.camera_movement?.type).filter(Boolean);
                    const speeds = lm.matched.map(s => s.camera_movement?.speed).filter(Boolean);
                    const durations = lm.matched.map(s => s.camera_movement?.duration).filter(Boolean);
                    if (types.length > 0) {
                        cameraInfo = {
                            type: [...new Set(types)].join(' + '),
                            speed: [...new Set(speeds)].join(' / '),
                            duration: [...new Set(durations)].join(' + ')
                        };
                    }
                } else {
                    // Single Match
                    const oldId = lm.matched[0].shot_id;
                    const globalUsage = usageCount.get(oldId) || 0;
                    const seenCount = oldShotSeenCounter.get(oldId) || 0;

                    if (globalUsage > 1) {
                        if (seenCount === 0) {
                            status = 'split'; // First occurrence -> "Original"
                        } else {
                            status = 'split-added'; // Subsequent -> "Added"
                        }
                    } else {
                        status = 'none';
                    }

                    oldShotSeenCounter.set(oldId, seenCount + 1);
                }

                if (baseShot) {
                    return {
                        ...baseShot,
                        shot_id: lm.shotId,
                        shot_text: lm.line,
                        camera_movement: cameraInfo,
                        updateStatus: status
                    };
                } else {
                    return {
                        shot_id: lm.shotId,
                        shot_type: 'regular',
                        shot_text: lm.line,
                        shot_character: [],
                        scene: scene.scene_title,
                        camera_movement: undefined,
                        updateStatus: status
                    } as Stage2Shot;
                }
            });

            setShots(newShots);
            onUpdate({ ...scene, shots: newShots });
        } else {
            // ENTER EDIT MODE
            setScenarioText(shots.map(s => s.shot_text).join('\n'));
        }
        setIsEditingScenario(!isEditingScenario);
    };

    const handleResetScenario = () => {
        if (!window.confirm("Original Initial Scenario 상태로 되돌리시겠습니까?")) return;
        setShots(initialShots);
        setScenarioText(initialShots.map(s => s.shot_text).join('\n'));
        onUpdate({ ...scene, shots: initialShots });
        setIsEditingScenario(false);
    };

    const is2A = step === 'shot_division_2A';

    return (
        <div className="flex h-full gap-6 p-6 overflow-hidden bg-bg-primary">

            {/* Left Column: Original/Editable Scenario */}
            <div className={`w-1/2 flex flex-col gap-0 overflow-hidden border rounded-2xl shadow-sm transition-all duration-300
                ${isEditingScenario ? 'border-accent-purple shadow-lg shadow-accent-purple/10 bg-bg-secondary' : 'border-border-color bg-bg-secondary'}
            `}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b sticky top-0 z-10 transition-colors
                     ${isEditingScenario ? 'bg-accent-purple/5 border-accent-purple/30' : 'bg-bg-secondary border-border-color'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${isEditingScenario ? 'bg-accent-purple/20' : 'bg-accent-purple/10'}`}>
                            <FileText size={18} className="text-accent-purple" />
                        </div>
                        <div>
                            <h2 className={`text-sm font-bold transition-colors ${isEditingScenario ? 'text-accent-purple' : 'text-white'}`}>
                                {isEditingScenario ? 'Editing Scenario...' : 'Original Scene Scenario'}
                            </h2>
                            <p className="text-[10px] text-text-secondary">Source Text</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {isEditingScenario && (
                            <button
                                onClick={handleResetScenario}
                                className="btn btn-sm btn-ghost btn-square text-text-secondary hover:text-accent-red"
                                title="Reset Changes"
                            >
                                <RotateCcw size={18} />
                            </button>
                        )}
                        <button
                            onClick={toggleEditMode}
                            className={`btn btn-sm btn-square transition-all ${isEditingScenario
                                ? 'btn-primary text-white shadow-lg shadow-primary/20'
                                : 'btn-ghost text-text-secondary hover:bg-bg-tertiary hover:text-white'}`}
                            title={isEditingScenario ? "Apply Changes" : "Edit Text"}
                        >
                            {isEditingScenario ? <Save size={18} /> : <Edit2 size={18} />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    {isEditingScenario ? (
                        <textarea
                            className="w-full h-full bg-transparent border-none focus:outline-none resize-none 
                                text-sm leading-relaxed font-sans text-text-primary/90 min-h-[400px]"
                            value={scenarioText}
                            onChange={(e) => setScenarioText(e.target.value)}
                            placeholder="Edit the scenario text here..."
                            autoFocus
                        />
                    ) : (
                        <div className="text-sm text-text-primary/80 whitespace-pre-wrap font-sans leading-relaxed space-y-4">
                            {shots.map((shot, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex gap-4">
                                        <span className="text-[10px] text-text-secondary/30 w-6 pt-1 select-none font-mono">{String(idx + 1).padStart(2, '0')}</span>
                                        <p className="hover:text-white transition-colors duration-200">{shot.shot_text}</p>
                                    </div>
                                    {idx < shots.length - 1 && (
                                        <div className="my-3 border-b border-dashed border-border-color/30 w-full ml-10"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Shot List */}
            <div className={`w-1/2 flex flex-col gap-0 overflow-hidden border border-border-color rounded-2xl bg-bg-secondary/30 shadow-sm relative transition-opacity duration-300
                ${isEditingScenario ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-color bg-bg-secondary sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <span className="badge badge-primary badge-sm font-bold min-w-[24px]">{shots.length}</span>
                        <h2 className="text-sm font-bold text-white">Shot List</h2>
                    </div>

                    {/* Prompt View Button */}
                    <button
                        onClick={() => setIsPromptOpen(true)}
                        className="btn btn-sm btn-ghost btn-square text-accent-blue hover:bg-accent-blue/10 hover:text-accent-blue"
                        title="View Final Prompt"
                    >
                        <Wand2 size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <div className="divide-border-color/50">
                        {shots.map((shot, idx) => (
                            <ShotAccordion
                                key={shot.shot_id || idx}
                                shot={shot}
                                is2A={is2A}
                                onUpdate={handleShotUpdate}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Prompt Modal */}
            <PromptModal
                isOpen={isPromptOpen}
                onClose={() => setIsPromptOpen(false)}
                currentShots={shots}
                originalShots={scene.shots}
                sceneTitle={scene.scene_id}
            />
        </div>
    );
};
