import { Stage1JSON, ValidationError, ErrorCategory, CurrentStep } from '../types/stage1.types';
import { Stage2JSON } from '../types/stage2.types';

/**
 * Stage 1 JSON Detailed Validation
 */
export function validateStage1Json(json: Stage1JSON): ValidationError[] {
    const errors: ValidationError[] = [];

    const addError = (
        category: ErrorCategory,
        message: string,
        path: string,
        severity: 'error' | 'warning' | 'info' = 'error'
    ) => {
        errors.push({
            type: 'schema', // Default type
            severity,
            category,
            path,
            message,
        });
    };

    // ---------------------------------------------------------------------------
    // 1. Essential Fields Validation
    // ---------------------------------------------------------------------------
    if (!json.film_id) {
        addError('essential', 'film_id가 누락되었습니다.', 'film_id');
    } else if (typeof json.film_id !== 'string') {
        addError('schema', 'film_id는 문자열이어야 합니다.', 'film_id');
    }

    if (!json.current_step) {
        addError('essential', 'current_step이 누락되었습니다.', 'current_step');
    } else {
        const validSteps: CurrentStep[] = [
            'synopsis_planning',
            'scenario_development',
            'asset_addition',
            'concept_art_blocks_completed',
            'concept_art_generation',
        ];
        if (!validSteps.includes(json.current_step)) {
            addError('schema', `유효하지 않은 단계(current_step)입니다: ${json.current_step}`, 'current_step', 'error');
        }
    }

    if (!json.film_metadata) {
        addError('essential', 'film_metadata가 누락되었습니다.', 'film_metadata');
    }

    if (!json.timestamp) {
        addError('essential', 'timestamp가 누락되었습니다.', 'timestamp');
    }

    // If essential structure is missing, stop further deep validation or proceed with caution?
    // We'll proceed but rely on optional chaining.

    // ---------------------------------------------------------------------------
    // 2. Story Validation (Based on current_step)
    // ---------------------------------------------------------------------------
    const step = json.current_step;
    const cw = json.current_work || {};

    // Check logline & synopsis existence
    if (['synopsis_planning', 'logline_synopsis_development'].includes(step as string)) {
        if (!cw.logline) addError('story', 'logline이 누락되었습니다.', 'current_work.logline', 'warning');
        if (!cw.synopsis) addError('story', 'synopsis가 누락되었습니다.', 'current_work.synopsis', 'warning');
    }

    // Check treatment
    if ((step as string) === 'treatment_expansion' || ['scenario_development', 'concept_art_blocks_completed'].includes(step)) {
        if (!cw.treatment) addError('story', 'treatment 객체가 누락되었습니다.', 'current_work.treatment', 'warning');
        else if (!cw.treatment.treatment_title) addError('story', 'treatment_title이 누락되었습니다.', 'current_work.treatment.treatment_title', 'warning');
    }

    // Check scenario
    if (['scenario_development', 'concept_art_blocks_completed'].includes(step)) {
        if (!cw.scenario) addError('story', 'scenario 객체가 누락되었습니다.', 'current_work.scenario');
        else {
            if (!cw.scenario.scenario_title) addError('story', 'scenario_title이 누락되었습니다.', 'current_work.scenario.scenario_title', 'warning');
            if (!Array.isArray(cw.scenario.scenes) || cw.scenario.scenes.length === 0) {
                addError('story', 'scenes 배열이 비어있거나 누락되었습니다.', 'current_work.scenario.scenes', 'warning');
            }
        }
    }

    // ---------------------------------------------------------------------------
    // 3. Visual Validation
    // ---------------------------------------------------------------------------
    const vb = json.visual_blocks || {};

    // Check existence if step requires it
    const requiresVisuals = ['asset_addition', 'concept_art_blocks_completed', 'concept_art_generation'].includes(step);

    if (requiresVisuals) {
        if (!json.visual_blocks) {
            addError('visual', 'visual_blocks 객체가 최상위 레벨에 누락되었습니다.', 'visual_blocks');
        } else {
            // Check arrays
            ['characters', 'locations', 'props'].forEach((key) => {
                // @ts-ignore - indexing visual_blocks
                if (!Array.isArray(vb[key])) {
                    addError('visual', `${key} 배열이 누락되었습니다.`, `visual_blocks.${key}`);
                } else {
                    // @ts-ignore
                    if (vb[key].length === 0) {
                        addError('visual', `${key} 목록이 비어있습니다.`, `visual_blocks.${key}`, 'warning');
                    }
                }
            });
        }
    } else {
        // Info if present when not required
        if (json.visual_blocks && Object.keys(json.visual_blocks).length > 0) {
            // Not an error, just present
        }
    }

    // ---------------------------------------------------------------------------
    // 4. Schema/Type Validation (Sample checks)
    // ---------------------------------------------------------------------------

    // Metadata types
    if (json.film_metadata) {
        if (typeof json.film_metadata.duration_minutes !== 'number' && json.film_metadata.duration_minutes !== undefined) {
            addError('schema', 'duration_minutes는 숫자여야 합니다.', 'film_metadata.duration_minutes');
        }
        // Check known optional fields that should have specific types if present
        if (json.film_metadata.artist && typeof json.film_metadata.artist !== 'string') {
            addError('schema', 'artist는 문자열이어야 합니다.', 'film_metadata.artist');
        }
    }

    // ---------------------------------------------------------------------------
    // 5. Other / Structural Checks
    // ---------------------------------------------------------------------------
    // Example: unexpected fields or structural anomalies
    const knownRootKeys = ['film_id', 'current_step', 'timestamp', 'film_metadata', 'current_work', 'visual_blocks'];
    Object.keys(json).forEach(key => {
        if (!knownRootKeys.includes(key)) {
            addError('other', `알 수 없는 최상위 필드입니다: ${key}`, key, 'info');
        }
    });

    return errors;
}

/**
 * Stage 2 JSON Detailed Validation
 */
export function validateStage2Json(json: Stage2JSON): ValidationError[] {
    const errors: ValidationError[] = [];

    const addError = (
        category: ErrorCategory,
        message: string,
        path: string,
        severity: 'error' | 'warning' | 'info' = 'error'
    ) => {
        errors.push({
            type: 'schema',
            severity,
            category,
            path,
            message,
        });
    };

    // 1. Essential Fields
    if (!json.film_id) addError('essential', 'film_id가 누락되었습니다.', 'film_id');
    else if (!/^FILM_[0-9]{6}$/.test(json.film_id)) addError('schema', 'film_id 형식이 올바르지 않습니다 (Example: FILM_123456)', 'film_id');

    if (!json.current_step) addError('essential', 'current_step이 누락되었습니다.', 'current_step');
    else if (!['shot_division_2A', 'visual_direction_2B'].includes(json.current_step)) {
        addError('schema', `유효하지 않은 단계(step)입니다: ${json.current_step}`, 'current_step');
    }

    if (!json.timestamp) addError('essential', 'timestamp가 누락되었습니다.', 'timestamp');

    const VALID_CAMERA_TYPES = [
        "static", "pan", "tilt", "dolly_in", "dolly_out", "dolly_zoom", "track", "truck",
        "crane", "crane_up", "crane_down", "handheld", "steadicam", "zoom", "rack_focus",
        "arc", "whip_pan", "whip_pan_down", "dutch_angle", "overhead", "worm_view",
        "spiral", "pendulum", "drift", "snap_zoom", "push_in", "pull_out",
        "slow_push_in", "quick_pull_back", "tracking_backward", "tracking_left",
        "tilt_down_then_focus"
    ];
    const VALID_SPEEDS = ["very_slow", "slow", "medium", "fast", "match_subject"];

    // 2. Scene Validation
    if (!json.scenes || !Array.isArray(json.scenes)) {
        addError('story', 'scenes 배열이 누락되었습니다.', 'scenes');
    } else if (json.scenes.length === 0) {
        addError('story', '최소 1개 이상의 Scene이 존재해야 합니다.', 'scenes', 'warning');
    } else {
        json.scenes.forEach((scene, sceneIdx) => {
            const sPath = `scenes[${sceneIdx}]`;

            // Scene ID
            if (!scene.scene_id) addError('essential', 'scene_id가 누락되었습니다.', `${sPath}.scene_id`);
            else if (!/^S[0-9]{2}$/.test(scene.scene_id)) addError('schema', 'scene_id 형식이 올바르지 않습니다 (Example: S01)', `${sPath}.scene_id`);

            // Check if scene_id matches index order (Warning)
            const expectedId = `S${String(sceneIdx + 1).padStart(2, '0')}`;
            if (scene.scene_id && scene.scene_id !== expectedId) {
                // addError('other', `Scene ID가 순서와 다릅니다. (Expected: ${expectedId})`, `${sPath}.scene_id`, 'info');
            }

            // Scene Title & Scenario
            if (!scene.scene_title) addError('story', 'scene_title이 누락되었습니다.', `${sPath}.scene_title`);
            if (!scene.scene_scenario) addError('story', 'scene_scenario가 누락되었습니다.', `${sPath}.scene_scenario`);

            // Concept Art References
            if (!scene.concept_art_references) {
                addError('visual', 'concept_art_references가 누락되었습니다.', `${sPath}.concept_art_references`);
            } else {
                ['characters', 'location', 'props'].forEach(key => {
                    // @ts-ignore
                    if (!scene.concept_art_references[key]) {
                        addError('visual', `${key} reference가 누락되었습니다.`, `${sPath}.concept_art_references.${key}`);
                    }
                });
            }

            // Shots Validation
            if (!scene.shots || !Array.isArray(scene.shots)) {
                addError('story', 'shots 배열이 누락되었습니다.', `${sPath}.shots`);
            } else if (scene.shots.length === 0) {
                addError('story', '최소 1개 이상의 Shot이 존재해야 합니다.', `${sPath}.shots`);
            } else {
                scene.shots.forEach((shot, shotIdx) => {
                    const shotPath = `${sPath}.shots[${shotIdx}]`;

                    // Shot ID
                    if (!shot.shot_id) addError('essential', 'shot_id가 누락되었습니다.', `${shotPath}.shot_id`);
                    // Check pattern Sxx.yy.zz
                    else if (!/^S[0-9]{2}\.[0-9]{2}\.[0-9]{2}$/.test(shot.shot_id)) {
                        addError('schema', 'shot_id 형식이 올바르지 않습니다 (Example: S01.01.01)', `${shotPath}.shot_id`);
                    }

                    // Shot Type
                    if (shot.shot_type && shot.shot_type !== 'regular') {
                        addError('schema', `shot_type은 'regular'여야 합니다. (Found: ${shot.shot_type})`, `${shotPath}.shot_type`);
                    }

                    // Shot Text
                    if (!shot.shot_text) addError('story', 'shot_text가 누락되었습니다.', `${shotPath}.shot_text`);

                    // Camera Movement
                    if (!shot.camera_movement) {
                        addError('visual', 'camera_movement가 누락되었습니다.', `${shotPath}.camera_movement`);
                    } else {
                        if (!shot.camera_movement.type) {
                            addError('schema', 'camera_movement.type이 누락되었습니다.', `${shotPath}.camera_movement.type`);
                        } else if (!VALID_CAMERA_TYPES.includes(shot.camera_movement.type)) {
                            addError('schema', `유효하지 않은 camera_type입니다: ${shot.camera_movement.type}`, `${shotPath}.camera_movement.type`);
                        }

                        if (shot.camera_movement.speed && !VALID_SPEEDS.includes(shot.camera_movement.speed)) {
                            addError('schema', `유효하지 않은 speed입니다: ${shot.camera_movement.speed}`, `${shotPath}.camera_movement.speed`);
                        }

                        if (shot.camera_movement.duration && !/^[0-9]+(\.[0-9]+)?s$/.test(shot.camera_movement.duration)) {
                            addError('schema', 'duration 형식이 올바르지 않습니다 (Example: 4s)', `${shotPath}.camera_movement.duration`);
                        }
                    }

                    // Movement Description
                    if (!shot.movement_description) {
                        addError('visual', 'movement_description이 누락되었습니다.', `${shotPath}.movement_description`);
                    }

                    // Frames
                    if (!shot.starting_frame) addError('visual', 'starting_frame이 누락되었습니다.', `${shotPath}.starting_frame`);
                    if (!shot.ending_frame) addError('visual', 'ending_frame이 누락되었습니다.', `${shotPath}.ending_frame`);
                });
            }
        });
    }

    return errors;
}
