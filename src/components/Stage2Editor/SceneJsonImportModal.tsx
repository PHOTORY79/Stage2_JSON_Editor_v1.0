import React, { useState } from 'react';
import { Stage2Scene } from '../../types/stage2.types';
import { FileJson, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface SceneJsonImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (scene: Stage2Scene) => void;
    currentSceneId: string;
}

export const SceneJsonImportModal: React.FC<SceneJsonImportModalProps> = ({ isOpen, onClose, onImport, currentSceneId }) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonText);

            // Basic Validation
            if (!parsed.scene_id || !Array.isArray(parsed.shots)) {
                throw new Error("Invalid Scene JSON Format: Missing 'scene_id' or 'shots' array.");
            }

            // ID Validation
            if (parsed.scene_id !== currentSceneId) {
                if (!window.confirm(`Warning: The pasted JSON matches Scene "${parsed.scene_id}", but you are currently editing "${currentSceneId}".\n\nDo you want to proceed and overwrite Scene ${currentSceneId}?`)) {
                    return;
                }
            }

            // Success
            onImport(parsed as Stage2Scene);
            onClose();
            setJsonText('');
            setError(null);
        } catch (err: any) {
            setError(err.message || "Invalid JSON syntax");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-bg-secondary w-[600px] h-[70vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-bg-secondary to-bg-tertiary">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-blue/10 rounded-lg">
                            <FileJson size={20} className="text-accent-blue" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Import Scene JSON</h3>
                            <p className="text-xs text-text-secondary">Paste updated JSON code for Scene {currentSceneId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-ghost btn-circle text-text-secondary hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col gap-4 bg-black/20">
                    <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 flex gap-3 text-xs text-text-primary/80 leading-relaxed">
                        <AlertTriangle size={16} className="text-accent-blue shrink-0 mt-0.5" />
                        <p>
                            Paste the full JSON object for this scene. This will completely replace the current shot list and metadata.
                        </p>
                    </div>

                    <textarea
                        className="flex-1 w-full bg-bg-primary/50 border border-white/10 rounded-xl p-4 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-blue/50 resize-none custom-scrollbar"
                        placeholder='{ "scene_id": "S01", "shots": [ ... ] }'
                        value={jsonText}
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            setError(null);
                        }}
                    />

                    {error && (
                        <div className="text-accent-red text-xs py-2 px-2 bg-accent-red/10 border border-accent-red/20 rounded flex items-center gap-2">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-bg-secondary flex justify-end gap-3 transition-colors">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost text-text-secondary hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!jsonText.trim()}
                        className="btn btn-primary bg-accent-blue text-white hover:bg-accent-blue/80 border-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle size={16} />
                        Import & Apply
                    </button>
                </div>

            </div>
        </div>
    );
};
