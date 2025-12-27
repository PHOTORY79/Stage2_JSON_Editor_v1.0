import { Stage1JSON, Character, Location, Prop } from '../types/stage1.types';
import { Stage2JSON, isStage2JSON, Stage2Scene } from '../types/stage2.types';

export interface ParsedFile {
    id: string;
    name: string;
    content: string;
    parsed: Stage1JSON | Stage2JSON;
    type: 'main' | 'asset' | 'unknown';
    filmId: string;
}

export interface MergeResult {
    success: boolean;
    mergedJson: Stage1JSON | Stage2JSON | null;
    errors: string[];
    warnings: string[];
}

export function mergeJsonFiles(files: ParsedFile[]): MergeResult {
    const result: MergeResult = {
        success: false,
        mergedJson: null,
        errors: [],
        warnings: []
    };

    if (files.length === 0) {
        result.errors.push("병합할 파일이 없습니다.");
        return result;
    }

    // 1. Validate Film ID consistency
    // Handle potential missing film_id in some loose asset files if necessary, but strictly required by schema
    const firstFilmId = files[0].parsed.film_id;
    const inconsistentFiles = files.filter(f => f.parsed.film_id !== firstFilmId);
    if (inconsistentFiles.length > 0) {
        result.errors.push(`모든 파일의 film_id가 일치해야 합니다. (기준: ${firstFilmId}, 불일치: ${inconsistentFiles.map(f => f.name).join(', ')})`);
        return result;
    }

    // Detect if Stage 2
    if (isStage2JSON(files[0].parsed)) {
        return mergeStage2Files(files as ParsedFile[]);
    }

    // --- Legacy Stage 1 Merge Logic ---
    // (Existing Stage 1 logic follows below...)

    // 2. Identify Main File (Stage 1)
    let mainFile = files.find(f => !isStage2JSON(f.parsed) && ((f.parsed as Stage1JSON).current_step === 'scenario_development' || ((f.parsed as Stage1JSON).current_work && (f.parsed as Stage1JSON).current_work.scenario)));

    if (!mainFile) {
        mainFile = files[0];
    }

    const merged: Stage1JSON = JSON.parse(JSON.stringify(mainFile.parsed));

    if (!merged.visual_blocks) {
        merged.visual_blocks = { characters: [], locations: [], props: [] };
    }
    if (!merged.visual_blocks.characters) merged.visual_blocks.characters = [];
    if (!merged.visual_blocks.locations) merged.visual_blocks.locations = [];
    if (!merged.visual_blocks.props) merged.visual_blocks.props = [];

    const charIds = new Set<string>(merged.visual_blocks.characters.map((c: Character) => c.id));
    const locIds = new Set<string>(merged.visual_blocks.locations.map((l: Location) => l.id));
    const propIds = new Set<string>(merged.visual_blocks.props.map((p: Prop) => p.id));

    for (const file of files) {
        if (file === mainFile) continue;
        if (isStage2JSON(file.parsed)) continue; // Should not mix stages

        const vb = (file.parsed as Stage1JSON).visual_blocks;
        if (!vb) continue;

        if (vb.characters) {
            vb.characters.forEach((char: Character) => {
                if (charIds.has(char.id)) {
                    result.warnings.push(`[${file.name}] 캐릭터 ID 중복 무시됨: ${char.id} (${char.name})`);
                } else {
                    merged.visual_blocks.characters.push(char);
                    charIds.add(char.id);
                }
            });
        }
        if (vb.locations) {
            vb.locations.forEach((loc: Location) => {
                if (locIds.has(loc.id)) {
                    result.warnings.push(`[${file.name}] 장소 ID 중복 무시됨: ${loc.id} (${loc.name})`);
                } else {
                    merged.visual_blocks.locations.push(loc);
                    locIds.add(loc.id);
                }
            });
        }
        if (vb.props) {
            vb.props.forEach((prop: Prop) => {
                if (propIds.has(prop.id)) {
                    result.warnings.push(`[${file.name}] 소품 ID 중복 무시됨: ${prop.id} (${prop.name})`);
                } else {
                    merged.visual_blocks.props.push(prop);
                    propIds.add(prop.id);
                }
            });
        }
    }

    const hasVisuals =
        (merged.visual_blocks.characters && merged.visual_blocks.characters.length > 0) ||
        (merged.visual_blocks.locations && merged.visual_blocks.locations.length > 0) ||
        (merged.visual_blocks.props && merged.visual_blocks.props.length > 0);

    if (hasVisuals && merged.current_step !== 'concept_art_blocks_completed') {
        merged.current_step = 'concept_art_blocks_completed';
    }

    result.success = true;
    result.mergedJson = merged;
    return result;
}

function mergeStage2Files(files: ParsedFile[]): MergeResult {
    const result: MergeResult = {
        success: false,
        mergedJson: null,
        errors: [],
        warnings: []
    };

    // Base is the first file, or specifically searched? 
    // New logic: Combine "scenes" arrays.
    // Use the first file as the "Metadata" base (film_id, timestamp, etc.)
    const baseFile = files[0];
    const merged: Stage2JSON = JSON.parse(JSON.stringify(baseFile.parsed));

    // Clear initial scenes to re-populate carefully or just use map
    // Actually, let's aggregate ALL scenes from ALL files
    const allScenes: Stage2Scene[] = [];
    const sceneIds = new Set<string>();

    for (const file of files) {
        if (!isStage2JSON(file.parsed)) {
            result.errors.push(`[${file.name}] Stage 2 형식이 아닙니다.`);
            continue;
        }

        const scenes = file.parsed.scenes || [];
        scenes.forEach(scene => {
            if (sceneIds.has(scene.scene_id)) {
                result.warnings.push(`[${file.name}] 씬 ID 중복: ${scene.scene_id} (덮어쓰지 않고 무시됨)`);
            } else {
                allScenes.push(scene);
                sceneIds.add(scene.scene_id);
            }
        });
    }

    // Sort scenes by ID (S01, S02, ...)
    allScenes.sort((a, b) => a.scene_id.localeCompare(b.scene_id));

    merged.scenes = allScenes;

    // Determine step? Keeping base file's step for now.

    result.success = true;
    result.mergedJson = merged;
    return result;
}
