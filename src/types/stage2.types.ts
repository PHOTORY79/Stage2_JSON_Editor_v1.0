export type Stage2Step = 'shot_division_2A' | 'visual_direction_2B';

export interface MovementDescription {
  action: Record<string, string>;
  expression: Record<string, string>;
  environment_move: string;
  mood_emotion: string;
}

export interface CameraMovement {
  type: string;
  speed?: string;
  duration?: string;
  secondary?: string;
  focus_shift?: string;
}

export interface FrameDescription {
  camera_composition: string;
  environment: string;
  [key: string]: string; // Allow dynamic character framing keys
}

export interface Stage2Shot {
  shot_id: string;
  shot_type: 'regular';
  shot_text: string;
  shot_character: string[];
  scene: string;
  movement_description?: MovementDescription;
  camera_movement?: CameraMovement;
  starting_frame?: FrameDescription;
  ending_frame?: FrameDescription;

  // Editor Specific Fields
  userRequest?: string; // For the "Request" field
  freeInput?: string;   // For the "Free Input" field (Right column)
  updateStatus?: 'new' | 'split' | 'split-added' | 'merged' | 'none'; // Tracking status for UI
}

export interface ConceptArtReferences {
  characters: string[];
  location: string;
  props: string[];
}

export interface Stage2Scene {
  scene_id: string;
  scene_title: string;
  scene_scenario: string;
  concept_art_references: ConceptArtReferences;
  shots: Stage2Shot[];
}

export interface Stage2JSON {
  film_id: string;
  current_step: Stage2Step;
  timestamp: string;
  scenes: Stage2Scene[];
}

// Helper to check if it's Stage 2
export function isStage2JSON(json: any): json is Stage2JSON {
  return json && Array.isArray(json.scenes) && (json.current_step === 'shot_division_2A' || json.current_step === 'visual_direction_2B');
}
