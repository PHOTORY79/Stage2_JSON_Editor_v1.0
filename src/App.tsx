import React, { useState, useRef, useCallback } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { JsonEditor } from './components/JsonInput/JsonEditor';
import { JsonInput } from './components/JsonInput/JsonInput';
import { ValidationPanel } from './components/Validation/ValidationPanel';
import { Stage1JSON, AppView, ValidationResult } from './types/stage1.types';
import { Stage2JSON, isStage2JSON, Stage2Scene } from './types/stage2.types';
import { mergeJsonFiles, ParsedFile } from './utils/jsonMerger';
import { validateStage1Json, validateStage2Json } from './utils/jsonValidator';
import { Stage2Editor } from './components/Stage2Editor/Stage2Editor';
import { X, Upload, FileText } from 'lucide-react';

function App() {
  const [jsonInput, setJsonInput] = useState<string>('');

  const [parsedJsonStage1, setParsedJsonStage1] = useState<Stage1JSON | null>(null);
  const [parsedJsonStage2, setParsedJsonStage2] = useState<Stage2JSON | null>(null);

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [currentView, setCurrentView] = useState<AppView | string>('empty');
  const [showEditor, setShowEditor] = useState(false);
  const [mergeWarnings, setMergeWarnings] = useState<string[]>([]);

  // Sidebar disable state for Stage 2 editing
  const [isSidebarDisabled, setIsSidebarDisabled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonLoad = useCallback((input: string | ParsedFile[]) => {
    try {
      let mainFile: Stage1JSON | Stage2JSON;
      let warnings: string[] = [];

      if (Array.isArray(input)) {
        // Merge Scenario
        const mergeResult = mergeJsonFiles(input);
        if (!mergeResult.mergedJson) throw new Error("Merge failed");
        mainFile = mergeResult.mergedJson;
        warnings = mergeResult.warnings;
      } else {
        // Single File Scenario
        mainFile = JSON.parse(input);
      }

      setMergeWarnings(warnings);

      if (isStage2JSON(mainFile)) {
        // Stage 2 Detected
        const stage2Data = mainFile as Stage2JSON;
        setParsedJsonStage2(stage2Data);
        setParsedJsonStage1(null);

        // Stage 2 Validation
        const errors = validateStage2Json(stage2Data);
        setValidationResult({
          isValid: errors.length === 0,
          errors: errors,
          autoFixed: false
        });

        if (stage2Data.scenes.length > 0) {
          setCurrentView(stage2Data.scenes[0].scene_id);
        } else {
          setCurrentView('empty');
        }
      } else {
        // Stage 1 Detected
        const stage1Data = mainFile as Stage1JSON;
        setParsedJsonStage1(stage1Data);
        setParsedJsonStage2(null);
        setCurrentView('metadata');

        const errors = validateStage1Json(stage1Data);
        setValidationResult({
          isValid: errors.length === 0,
          errors: errors,
          autoFixed: false
        });
      }

      setJsonInput(Array.isArray(input) ? '' : input);
      setShowEditor(false);

    } catch (err: any) {
      console.error('JSON Parse Error:', err);
      // Handle Syntax Error
      if (typeof input === 'string') {
        const positionMatch = err.message.match(/position\s+(\d+)/i);
        let suggestion = 'Please fix syntax errors in the editor.';
        let path = 'Parsing';

        if (positionMatch) {
          const position = parseInt(positionMatch[1], 10);
          const lines = input.substring(0, position).split('\n');
          const line = lines.length;
          path = `Line ${line}`;

          const allLines = input.split('\n');
          const startLine = Math.max(0, line - 3);
          const endLine = Math.min(allLines.length, line + 2);
          const context = allLines.slice(startLine, endLine)
            .map((l, i) => `${startLine + i + 1}: ${l}`)
            .join('\n');
          suggestion = `오류 위치 근처:\n${context}`;
        }

        setValidationResult({
          isValid: false,
          errors: [{
            type: 'syntax',
            category: 'essential',
            severity: 'error',
            message: err.message || 'Invalid JSON format',
            path: path,
            suggestion: suggestion
          }],
          autoFixed: false
        });
        setJsonInput(input);
        setShowEditor(true);
      } else {
        alert('Invalid JSON format or Merge failed');
      }
    }
  }, []);

  const handleDownload = () => {
    const dataToDownload = parsedJsonStage2 || parsedJsonStage1;
    if (!dataToDownload) return;

    let filename = 'data.json';
    if (parsedJsonStage2) {
      filename = `${parsedJsonStage2.scenes[0]?.scene_id || 'stage2'}_edited.json`;
    } else if (parsedJsonStage1) {
      filename = `${parsedJsonStage1.film_id}_${parsedJsonStage1.current_step}.json`;
    }

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditorApply = (newJson: string) => {
    handleJsonLoad(newJson);
  };

  const handleStage2SceneUpdate = (updatedScene: Stage2Scene) => {
    if (!parsedJsonStage2) return;

    const newScenes = parsedJsonStage2.scenes.map(s =>
      s.scene_id === updatedScene.scene_id ? updatedScene : s
    );

    setParsedJsonStage2({
      ...parsedJsonStage2,
      scenes: newScenes
    });
  };

  const handleReset = () => {
    if (window.confirm("정말 모든 데이터를 초기화하시겠습니까?")) {
      setParsedJsonStage1(null);
      setParsedJsonStage2(null);
      setJsonInput('');
      setValidationResult(null);
      setCurrentView('empty');
      setMergeWarnings([]);
    }
  };

  const renderContent = () => {
    if (showEditor) {
      const currentJsonObj = parsedJsonStage2 || parsedJsonStage1 || {};
      return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col">
          <JsonEditor
            jsonInput={
              validationResult?.errors.some(e => e.type === 'syntax') && jsonInput
                ? jsonInput
                : JSON.stringify(currentJsonObj, null, 2)
            }
            errors={validationResult?.errors || []}
            onJsonUpdate={() => { }} // No-op, we wait for validate/apply
            onValidate={handleEditorApply}
          />
        </div>
      );
    }

    if (currentView === 'validation' && (parsedJsonStage1 || parsedJsonStage2) && validationResult) {
      return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          <ValidationPanel
            result={validationResult}
          />
        </div>
      );
    }

    if (parsedJsonStage2) {
      const activeScene = parsedJsonStage2.scenes.find(s => s.scene_id === currentView);
      if (activeScene) {
        return (
          <Stage2Editor
            scene={activeScene}
            step="shot_division_2A"
            onUpdate={handleStage2SceneUpdate}
            onEditModeChange={setIsSidebarDisabled}
          />
        );
      }
      return <div className="text-text-secondary p-10 flex items-center justify-center h-full">Select a scene from the sidebar.</div>;
    }

    // Empty State
    return <JsonInput onJsonLoad={handleJsonLoad} />;
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
      <Header
        title="AIFI Stage 2 Editor"
        onLoad={handleJsonLoad}
        onEdit={() => setShowEditor(true)}
        onReset={handleReset}
        onDownload={handleDownload}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        hasData={!!parsedJsonStage1 || !!parsedJsonStage2}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentView={currentView}
          data={parsedJsonStage1}
          stage2Scenes={parsedJsonStage2?.scenes}
          hasErrors={validationResult ? validationResult.errors.length > 0 : false}
          errorCount={validationResult ? validationResult.errors.length : 0}
          onViewChange={setCurrentView}
          disabled={isSidebarDisabled}
        />

        <main className="flex-1 overflow-hidden relative">
          {mergeWarnings.length > 0 && (
            <div className="absolute top-4 right-4 z-50 animate-fade-in-up w-96">
              <div className="bg-bg-secondary border border-accent-orange/30 rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-accent-orange/10 px-4 py-2 border-b border-accent-orange/20 flex justify-between items-center">
                  <span className="text-accent-orange font-bold text-xs uppercase tracking-wider">Merge Warnings</span>
                  <button onClick={() => setMergeWarnings([])} className="text-text-secondary hover:text-white"><X size={14} /></button>
                </div>
                <div className="p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {mergeWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-text-primary/80 flex gap-2">
                        <span className="text-accent-orange">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
