import { isPath, type Path } from '@owlbear-rodeo/sdk';
import type { CanvasKit, Path as SkiaPath } from 'canvaskit-wasm';
import { obrPathToSkiaPath } from './obrPathToSkiaPath';

/**
 * Given a new CanvasKit path and a list of OBR Path items, returns only the items
 * whose paths overlap or border the new path.
 *
 * Works by expanding the new path by 1px and checking intersection with each item.
 */
export function findTouchingPaths (newPath: SkiaPath, items: Path[], canvasKit: CanvasKit): Path[] {
    // Expand the new path by 1px to catch bordering (shared-edge) cases.
    const expanded = newPath.copy();
    const stroked = newPath.copy();
    const strokeResult = stroked.stroke({ width: 2 });
    if (strokeResult) {
        expanded.op(stroked, canvasKit.PathOp.Union);
    }
    stroked.delete();

    const touching: Path[] = [];
    for (const item of items) {
        if (!isPath(item)) continue;
        const existingPath = obrPathToSkiaPath(item.commands, canvasKit, item.position);
        const test = expanded.copy();
        test.op(existingPath, canvasKit.PathOp.Intersect);
        if (!test.isEmpty())
            touching.push(item);
        test.delete();
        existingPath.delete();
    }

    expanded.delete();
    return touching;
}

/**
 * Performs cascading merge: repeatedly finds touching items, unions their paths,
 * and checks for new touches until stable.
 *
 * Returns the merged CanvasKit path and the list of all items that were merged.
 * The caller is responsible for deleting the returned path.
 */
export function cascadingMerge (
    newPath: SkiaPath,
    candidates: Path[],
    canvasKit: CanvasKit,
): { mergedPath: SkiaPath; mergedItems: Path[] } {
    const merged = newPath.copy();
    const allMerged: Path[] = [];
    let remaining = [...candidates];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const touching = findTouchingPaths(merged, remaining, canvasKit);
        if (touching.length === 0) break;

        const touchingIds = new Set(touching.map(i => i.id));
        for (const item of touching) {
            const itemPath = obrPathToSkiaPath(item.commands, canvasKit, item.position);
            merged.op(itemPath, canvasKit.PathOp.Union);
            itemPath.delete();
        }
        merged.simplify();

        allMerged.push(...touching);
        remaining = remaining.filter(i => !touchingIds.has(i.id));
    }

    return { mergedPath: merged, mergedItems: allMerged };
}
