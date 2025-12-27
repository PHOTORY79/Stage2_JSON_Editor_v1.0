import React from 'react';
import { Upload, RotateCcw, Download, Film, Edit3 } from 'lucide-react';
import { ParsedFile } from '../../utils/jsonMerger';

interface HeaderProps {
  title: string;
  onLoad: (input: string | ParsedFile[]) => void;
  onEdit: () => void;
  onDownload: () => void;
  onReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  hasData: boolean;
}

export function Header({ title, onLoad, onEdit, onDownload, onReset, fileInputRef, hasData }: HeaderProps) {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    Promise.all(fileList.map(file => {
      return new Promise<ParsedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);
            resolve({
              id: file.name,
              name: file.name,
              content: content,
              parsed: parsed,
              type: 'unknown',
              filmId: parsed.film_id || 'unknown'
            });
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsText(file);
      });
    })).then(results => {
      onLoad(results);
    });

    // Reset value
    event.target.value = '';
  };


  return (
    <header className="h-16 bg-bg-secondary border-b border-border-color flex items-center justify-between px-6 shrink-0">
      {/* Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
        multiple
      />

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-purple-dark 
          flex items-center justify-center shadow-lg shadow-accent-purple/20">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-text-secondary">AI Film Framework 5.0</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-color 
            text-text-secondary hover:text-white hover:border-accent-purple hover:bg-accent-purple/5
            transition-all duration-200 group"
        >
          <Upload className="w-4 h-4 group-hover:text-accent-purple transition-colors" />
          <span className="text-sm font-medium">Upload</span>
        </button>

        <button
          onClick={onReset}
          disabled={!hasData}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200
            ${hasData
              ? 'border-border-color text-text-secondary hover:text-white hover:border-accent-red hover:bg-accent-red/5'
              : 'border-border-color/30 text-text-secondary/30 cursor-not-allowed'
            }`}
          title="모든 입력 초기화"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">Reset</span>
        </button>

        <button
          onClick={onDownload}
          disabled={!hasData}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200
            ${hasData
              ? 'bg-gradient-to-r from-accent-purple to-accent-purple-dark text-white shadow-lg shadow-accent-purple/25 hover:shadow-accent-purple/40 hover:scale-[1.02]'
              : 'bg-bg-tertiary text-text-secondary/40 cursor-not-allowed'
            }`}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Save JSON</span>
        </button>
      </div>
    </header>
  );
}
