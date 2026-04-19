import { type Cell, grid } from '@davidsev/owlbear-utils';
import OBR, { buildPath, isPath, type Path, type PathCommand } from '@owlbear-rodeo/sdk';
import type { CanvasKit, Path as SkiaPath } from 'canvaskit-wasm';
import { type MergeGroup, mergeItemMetadataMapper } from '../../Metadata/MergeItemMetadata';
import { type FillStyle, type StrokeStyle, settings } from '../../Settings/Settings';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { addCellsToPath } from '../../Utils/cellsToPath';
import { cascadingMerge } from '../../Utils/findTouchingPaths';
import { getGridColor } from '../../Utils/getGridColor';
import getId from '../../Utils/getId';
import { obrPathToSkiaPath } from '../../Utils/obrPathToSkiaPath';
import { sharedEdgesToPathCommands } from '../../Utils/sharedEdgesToPathCommands';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import type { ShapeInterface } from '../Shapes/ShapeInterface';
import { BaseRenderer } from './BaseRenderer';

export class DrawingRenderer extends BaseRenderer {

    public allStylesDisabled (hasInnerLines: boolean): boolean {
        return settings.borderMode === 'off'
            && settings.fillMode === 'off'
            && (!hasInnerLines || settings.innerLinesMode === 'off');
    }

    public async startPreview (shape: ShapeInterface): Promise<void> {

        const [pathCommands, guidePathCommands, innerLinesCommands, border, fill, innerLines] = await Promise.all([
            shape.getPathCommands(),
            shape.getGuidePathCommands(),
            shape.getInnerLinesPathCommands(),
            settings.resolvedBorder(),
            settings.resolvedFill(),
            settings.resolvedInnerLines(),
        ]);

        // Fill path (back)
        if (fill) {
            this.path = buildPath()
                .position({ x: 0, y: 0 })
                .locked(true)
                .strokeWidth(0)
                .fillColor(fill.fillColor)
                .fillOpacity(fill.fillOpacity)
                .fillRule('evenodd')
                .disableHit(true)
                .layer('POPOVER')
                .commands(pathCommands)
                .build();
        }

        // Inner lines (middle)
        if (innerLines) {
            this.innerLinesPath = buildPath()
                .position({ x: 0, y: 0 })
                .locked(true)
                .strokeColor(innerLines.strokeColor)
                .strokeWidth(innerLines.strokeWidth)
                .strokeOpacity(innerLines.strokeOpacity)
                .strokeDash(innerLines.strokeDash)
                .fillOpacity(0)
                .disableHit(true)
                .layer('POPOVER')
                .commands(innerLinesCommands ?? [])
                .build();
        }

        // Border path (front)
        if (border) {
            this.borderPath = buildPath()
                .position({ x: 0, y: 0 })
                .locked(true)
                .strokeColor(border.strokeColor)
                .strokeWidth(border.strokeWidth)
                .strokeOpacity(border.strokeOpacity)
                .strokeDash(border.strokeDash)
                .fillOpacity(0)
                .disableHit(true)
                .layer('POPOVER')
                .commands(pathCommands)
                .build();
        }

        if (guidePathCommands) {
            const colour = getGridColor(grid.style.lineColor);
            this.guidePath = buildPath()
                .strokeColor(colour)
                .position({ x: 0, y: 0 })
                .locked(true)
                .fillOpacity(0)
                .strokeWidth(2)
                .disableHit(true)
                .layer('POPOVER')
                .commands(guidePathCommands)
                .build();
        }

        const items: Path[] = [];
        if (this.path) items.push(this.path);
        if (this.innerLinesPath) items.push(this.innerLinesPath);
        if (this.borderPath) items.push(this.borderPath);

        await Promise.all([
            items.length > 0 ? OBR.scene.local.addItems(items) : Promise.resolve(),
            this.guidePath ? OBR.scene.local.addItems([this.guidePath]) : Promise.resolve(),
        ]);
    }

    private async nextZIndex (): Promise<number> {
        // We need explicit z-indices because adding the fill/innerLines/border items in a single
        // addItems call doesn't guarantee their final z-order — we need fill < innerLines < border.
        // reduce (rather than Math.max(...spread)) avoids stack-overflow on very large scenes.
        const items = await OBR.scene.items.getItems(i => i.layer === 'DRAWING');
        return items.reduce((m, i) => Math.max(m, i.zIndex), 0) + 1;
    }

    public async saveFinalShape (shape: ShapeInterface, mergeGroup: MergeGroup): Promise<void> {
        const [pathCommands, innerLinesCommands, border, fill, innerLines, zIndex] = await Promise.all([
            shape.getPathCommands(),
            shape.getInnerLinesPathCommands(),
            settings.resolvedBorder(),
            settings.resolvedFill(),
            settings.resolvedInnerLines(),
            this.nextZIndex(),
        ]);

        if (pathCommands.length === 0) return;

        let finalPathCommands = pathCommands;
        let finalInnerLinesCommands = innerLinesCommands;
        const idsToDelete: string[] = [];

        // Auto-merge: find touching items and merge paths
        if (settings.autoMergeDrawing !== 'off') {
            const canvasKit = await awaitCanvasKit();
            const allItems = await OBR.scene.items.getItems<Path>(i => isPath(i) && i.layer === 'DRAWING');
            const itemMap = new Map(allItems.map(i => [i.id, i]));

            // Find fill items with matching merge group (and optionally matching style)
            const matchStyle = settings.autoMergeDrawing === 'matchStyle';
            const effectiveInnerLines = innerLinesCommands ? innerLines : null;
            const fillItems = allItems.filter(item => {
                const meta = mergeItemMetadataMapper.get(item);
                if (meta.group !== mergeGroup || meta.role !== 'fill') return false;
                if (matchStyle && !this.itemMatchesStyle(item, itemMap, fill, border, effectiveInnerLines))
                    return false;
                return true;
            });

            if (fillItems.length > 0) {
                const newPath = obrPathToSkiaPath(pathCommands, canvasKit);
                const { mergedPath, mergedItems } = cascadingMerge(newPath, fillItems, canvasKit);
                newPath.delete();

                if (mergedItems.length > 0) {
                    // Collect all items to delete (merged fills + their siblings)
                    for (const mergedFill of mergedItems) {
                        for (const id of this.collectAttachmentGroup(mergedFill, itemMap))
                            idsToDelete.push(id);
                    }

                    if (mergeGroup === 'cells') {
                        // Derive cells from merged path and recompute outline + inner lines
                        const derived = this.deriveCellsFromPath(mergedPath, canvasKit);
                        finalPathCommands = derived.outline;
                        finalInnerLinesCommands = derived.innerLines;
                    } else {
                        // Brush: just use the union path
                        finalPathCommands = skiaPathToObrPath(mergedPath.toCmds());
                    }
                }

                mergedPath.delete();
            }
        }

        // Build items with metadata
        const items: Path[] = [];
        const mergeMetaKey = getId('merge');

        // Fill path (back)
        if (fill) {
            items.push(buildPath()
                .position({ x: 0, y: 0 })
                .layer('DRAWING')
                .zIndex(zIndex)
                .strokeWidth(0)
                .fillColor(fill.fillColor)
                .fillOpacity(fill.fillOpacity)
                .fillRule('evenodd')
                .metadata({ [mergeMetaKey]: { group: mergeGroup, role: 'fill' } })
                .commands(finalPathCommands)
                .build());
        }

        // Inner lines (middle)
        if (finalInnerLinesCommands && innerLines) {
            items.push(buildPath()
                .position({ x: 0, y: 0 })
                .layer('DRAWING')
                .zIndex(zIndex + 1)
                .strokeColor(innerLines.strokeColor)
                .strokeWidth(innerLines.strokeWidth)
                .strokeOpacity(innerLines.strokeOpacity)
                .strokeDash(innerLines.strokeDash)
                .fillOpacity(0)
                .metadata({ [mergeMetaKey]: { group: mergeGroup, role: 'innerLines' } })
                .commands(finalInnerLinesCommands)
                .build());
        }

        // Border path (front)
        if (border) {
            items.push(buildPath()
                .position({ x: 0, y: 0 })
                .layer('DRAWING')
                .zIndex(zIndex + 2)
                .strokeColor(border.strokeColor)
                .strokeWidth(border.strokeWidth)
                .strokeOpacity(border.strokeOpacity)
                .strokeDash(border.strokeDash)
                .fillOpacity(0)
                .metadata({ [mergeMetaKey]: { group: mergeGroup, role: 'border' } })
                .commands(finalPathCommands)
                .build());
        }

        if (items.length === 0) return;

        // Attach items in a loop so they move/select together
        if (items.length > 1) {
            for (let i = 0; i < items.length; i++) {
                const cur = items[i];
                const next = items[(i + 1) % items.length];
                if (!cur || !next) continue;
                cur.attachedTo = next.id;
            }
        }

        await OBR.scene.items.addItems(items);

        if (idsToDelete.length > 0)
            await OBR.scene.items.deleteItems([...new Set(idsToDelete)]);
    }

    /** Collect all item IDs in an attachment group (including the given item). */
    private collectAttachmentGroup (item: Path, itemMap: Map<string, Path>): string[] {
        const ids: string[] = [item.id];
        let current = item;
        // Attachment chains are at most 3 items (fill, innerLines, border) — the counter
        // is a safety cap in case metadata is ever corrupted into an unbounded loop.
        for (let i = 0; i < 3 && current.attachedTo; i++) {
            const next = itemMap.get(current.attachedTo);
            if (!next || next.id === item.id) break;
            ids.push(next.id);
            current = next;
        }
        return ids;
    }

    /** Check whether a candidate fill item (and its attachment siblings) match the given styles. */
    private itemMatchesStyle (
        fillItem: Path,
        itemMap: Map<string, Path>,
        fill: FillStyle | null,
        border: StrokeStyle | null,
        innerLines: StrokeStyle | null,
    ): boolean {
        // Current draw has no fill — nothing to merge with
        if (!fill) return false;

        if (fillItem.style.fillColor !== fill.fillColor || Math.abs(fillItem.style.fillOpacity - fill.fillOpacity) > 0.01)
            return false;

        // Find siblings via attachment chain
        const siblings = this.findSiblingsByRole(fillItem, itemMap);

        if (!this.strokeStyleMatches(siblings.get('border'), border))
            return false;
        if (!this.strokeStyleMatches(siblings.get('innerLines'), innerLines))
            return false;

        return true;
    }

    /** Check whether an existing item's stroke style matches the expected style (both present and equal, or both absent). */
    private strokeStyleMatches (item: Path | undefined, expected: StrokeStyle | null): boolean {
        if (expected && item) {
            return item.style.strokeColor === expected.strokeColor
                && item.style.strokeWidth === expected.strokeWidth
                && Math.abs(item.style.strokeOpacity - expected.strokeOpacity) <= 0.01
                && this.strokeDashEquals(item.style.strokeDash, expected.strokeDash);
        }
        return !expected === !item;
    }

    /** Walk the attachment chain from a fill item and return siblings keyed by merge role. */
    private findSiblingsByRole (fillItem: Path, itemMap: Map<string, Path>): Map<string, Path> {
        const result = new Map<string, Path>();
        let current = fillItem;
        for (let i = 0; i < 3 && current.attachedTo; i++) {
            const next = itemMap.get(current.attachedTo);
            if (!next || next.id === fillItem.id) break;
            const meta = mergeItemMetadataMapper.get(next);
            if (meta.role) result.set(meta.role, next);
            current = next;
        }
        return result;
    }

    private strokeDashEquals (a: number[], b: number[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /** Derive cells from a merged CanvasKit path and recompute outline + inner lines. */
    private deriveCellsFromPath (mergedPath: SkiaPath, canvasKit: CanvasKit): {
        outline: PathCommand[];
        innerLines: PathCommand[] | null;
    } {
        const bounds = Array.from(mergedPath.getBounds());
        if(bounds.length !== 4)
            throw new Error('Merged path bounds must be 4-dimensional');
        const [left, top, right, bottom] = Array.from(mergedPath.getBounds()) as [number, number, number, number];
        const cornerCells = [
            grid.getCell({ x: left, y: top }),
            grid.getCell({ x: right, y: top }),
            grid.getCell({ x: left, y: bottom }),
            grid.getCell({ x: right, y: bottom }),
        ];
        const allCells = grid.iterateCellsBoundingPoints(cornerCells as Cell[]);

        // Expand the path slightly to counteract geometry drift from CanvasKit simplify/union.
        const expanded = mergedPath.copy();
        const stroked = mergedPath.copy();
        if (stroked.stroke({ width: 4 }))
            expanded.op(stroked, canvasKit.PathOp.Union);
        stroked.delete();

        const matchingCells = allCells.filter(
            (cell: Cell) => expanded.contains(cell.center.x, cell.center.y),
        );
        expanded.delete();

        if (matchingCells.length === 0) {
            // Fallback: use the raw merged path
            return { outline: skiaPathToObrPath(mergedPath.toCmds()), innerLines: null };
        }

        // Recompute outline from cells
        const outlinePath = new canvasKit.Path();
        addCellsToPath(matchingCells, outlinePath);
        outlinePath.simplify();
        const outline = skiaPathToObrPath(outlinePath.toCmds());
        outlinePath.delete();

        // Recompute inner lines from cells
        const innerLinesResult = matchingCells.length >= 2
            ? sharedEdgesToPathCommands(matchingCells)
            : null;

        return { outline, innerLines: innerLinesResult };
    }
}
