import {
  FileText,
  BookOpen,
  ScrollText,
  Clapperboard,
  Users,
  MapPin,
  Box,
  AlertCircle,
  CheckCircle,
  Lock
} from 'lucide-react';
import { AppView, Stage1JSON, CurrentStep } from '../../types/stage1.types';
import { Stage2Scene } from '../../types/stage2.types';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  availableFrom: string[];
}

// Update these to match CurrentStep type exactly + add all subsequent steps
const navItems: NavItem[] = [
  {
    id: 'metadata',
    label: 'Metadata',
    icon: <FileText className="w-4 h-4" />,
    availableFrom: ['synopsis_planning', 'scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'synopsis',
    label: 'Synopsis',
    icon: <BookOpen className="w-4 h-4" />,
    availableFrom: ['synopsis_planning', 'scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'treatment',
    label: 'Treatment',
    icon: <ScrollText className="w-4 h-4" />,
    availableFrom: ['synopsis_planning', 'scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'scenario',
    label: 'Scenario',
    icon: <Clapperboard className="w-4 h-4" />,
    availableFrom: ['scenario_development', 'asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: <Users className="w-4 h-4" />,
    availableFrom: ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: <MapPin className="w-4 h-4" />,
    availableFrom: ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
  {
    id: 'props',
    label: 'Props',
    icon: <Box className="w-4 h-4" />,
    availableFrom: ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation']
  },
];

interface SidebarProps {
  currentView: AppView | string; // Allow string for scene IDs
  data: Stage1JSON | null;
  stage2Scenes?: Stage2Scene[]; // Optional Stage 2 Data
  hasErrors: boolean;
  errorCount: number;
  onViewChange: (view: AppView | string) => void;
  disabled?: boolean;
}

export function Sidebar({ currentView, data, stage2Scenes, hasErrors, errorCount, onViewChange, disabled }: SidebarProps) {

  // Common wrapper styles for disabled state
  const containerClass = `w-60 bg-bg-secondary border-r border-border-color flex flex-col h-full transition-opacity duration-200 ${disabled ? 'opacity-50 pointer-events-none select-none' : ''}`;

  // --- STAGE 2 RENDER ---
  if (stage2Scenes) {
    return (
      <aside className={containerClass}>
        <div className="p-6 border-b border-border-color/50">
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            Stage 2 Editor
          </h1>
          <p className="text-xs text-text-secondary mt-1">Shot Division & Visuals</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-5 mb-3">
            <span className="text-[10px] font-semibold text-text-secondary/60 uppercase tracking-widest">
              Scenes
            </span>
          </div>

          <div className="space-y-1 px-3">
            {stage2Scenes.map((scene) => {
              const isActive = currentView === scene.scene_id;
              return (
                <button
                  key={scene.scene_id}
                  onClick={() => onViewChange(scene.scene_id)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left
                                transition-all duration-200 group relative
                                ${isActive
                      ? 'bg-gradient-to-r from-accent-purple/20 to-accent-purple/5 text-white'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-purple rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`transition-colors ${isActive ? 'text-accent-purple' : ''}`}>
                      <Clapperboard className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-medium truncate">{scene.scene_id}</span>
                  </div>
                  <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded text-text-secondary group-hover:text-white transition-colors">
                    {scene.shots.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Validation Link (Shared) */}
        <div className="p-4 border-t border-border-color">
          <button
            onClick={() => onViewChange('validation')}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${currentView === 'validation'
                ? 'bg-gradient-to-r from-accent-purple/20 to-accent-purple/5'
                : 'hover:bg-bg-tertiary'
              }
                ${hasErrors ? 'text-accent-red' : 'text-accent-green'}`}
          >
            {hasErrors ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">Validation</span>
            {hasErrors && (
              <span className="ml-auto bg-accent-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {errorCount}
              </span>
            )}
          </button>
        </div>
      </aside>
    );
  }


  // --- STAGE 1 LOGIC ---
  const isAvailable = (item: NavItem): boolean => {
    if (disabled) return false;
    if (!data) return false;
    const currentStep = data.current_step;

    // 1. Step check: checks if currentStep is in the list
    if (!item.availableFrom.includes(currentStep)) return false;

    // 2. Data existence check
    switch (item.id) {
      case 'metadata':
        return true;
      case 'synopsis':
        return !!(data.current_work?.logline || data.current_work?.synopsis);
      case 'treatment':
        return !!(data.current_work?.treatment?.sequences?.length || data.current_work?.treatment?.treatment_title);
      case 'scenario':
        return !!(data.current_work?.scenario?.scenes?.length);
      case 'characters':
        return !!(data.visual_blocks?.characters?.length);
      case 'locations':
        return !!(data.visual_blocks?.locations?.length);
      case 'props':
        return !!(data.visual_blocks?.props?.length);
      default:
        return true;
    }
  };

  return (
    <aside className={containerClass}>
      {/* Navigation */}
      <nav className="flex-1 py-6">
        <div className="px-5 mb-3">
          <span className="text-[10px] font-semibold text-text-secondary/60 uppercase tracking-widest">
            Sections
          </span>
        </div>

        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const available = isAvailable(item);
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => available && onViewChange(item.id)}
                disabled={!available}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-accent-purple/20 to-accent-purple/5 text-white'
                    : available
                      ? 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
                      : 'text-text-secondary/30 cursor-not-allowed'
                  }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-purple rounded-r-full" />
                )}

                <span className={`transition-colors ${isActive ? 'text-accent-purple' : ''}`}>
                  {available ? item.icon : <Lock className="w-4 h-4" />}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Validation Status */}
      <div className="p-4 border-t border-border-color">
        <button
          onClick={() => onViewChange('validation')}
          disabled={disabled}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl
            transition-all duration-200
            ${currentView === 'validation'
              ? 'bg-gradient-to-r from-accent-purple/20 to-accent-purple/5'
              : 'hover:bg-bg-tertiary'
            }
            ${hasErrors ? 'text-accent-red' : 'text-accent-green'}`}
        >
          {hasErrors ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">Validation</span>
          {hasErrors && (
            <span className="ml-auto bg-accent-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {errorCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
