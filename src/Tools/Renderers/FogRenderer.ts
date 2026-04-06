import { grid } from '@davidsev/owlbear-utils';
import OBR, { buildPath, isPath, type Path } from '@owlbear-rodeo/sdk';
import { type MergeGroup, mergeItemMetadataMapper } from '../../Metadata/MergeItemMetadata';
import { settings } from '../../Settings/Settings';
import { awaitCanvasKit } from '../../Utils/awaitCanvasKit';
import { cascadingMerge } from '../../Utils/findTouchingPaths';
import { getGridColor } from '../../Utils/getGridColor';
import getId from '../../Utils/getId';
import { obrPathToSkiaPath } from '../../Utils/obrPathToSkiaPath';
import { skiaPathToObrPath } from '../../Utils/skiaPathToObrPath';
import type { ShapeInterface } from '../Shapes/ShapeInterface';
import { BaseRenderer } from './BaseRenderer';

export class FogRenderer extends BaseRenderer {

    public allStylesDisabled (): boolean {
        return false;
    }

    public async startPreview (shape: ShapeInterface): Promise<void> {

        // Get the grid colour to use for the highlight.
        const colour = getGridColor(grid.style.lineColor);

        const [pathCommands, guidePathCommands] = await Promise.all([
            shape.getPathCommands(),
            shape.getGuidePathCommands(),
        ]);

        this.path = buildPath()
            .strokeColor(colour)
            .position({ x: 0, y: 0 })
            .locked(true)
            .fillOpacity(0)
            .strokeWidth(3)
            .disableHit(true)
            .layer('POPOVER')
            .commands(pathCommands)
            .build();

        if (guidePathCommands)
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

        await Promise.all([
            OBR.scene.local.addItems([this.path]),
            this.guidePath ? OBR.scene.local.addItems([this.guidePath]) : Promise.resolve(),
        ]);
    }

    public async saveFinalShape (shape: ShapeInterface, mergeGroup: MergeGroup): Promise<void> {
        const [pathCommands, fogMetadata] = await Promise.all([
            shape.getPathCommands(),
            OBR.tool.getMetadata('rodeo.owlbear.tool/fog'),
        ]);
        const cut = !!fogMetadata?.cut;

        if (pathCommands.length === 0) return;

        let finalPathCommands = pathCommands;
        const idsToDelete: string[] = [];

        // Auto-merge: find touching fog items and merge paths
        if (settings.autoMergeFog === 'on') {
            const canvasKit = await awaitCanvasKit();
            const allFogItems = await OBR.scene.items.getItems<Path>(i => isPath(i) && i.layer === 'FOG');

            // Find fog items with matching merge group and same cut state
            const candidates = allFogItems.filter(item => {
                const meta = mergeItemMetadataMapper.get(item);
                return meta.group === mergeGroup && meta.role === 'fog' && item.visible === !cut;
            });

            if (candidates.length > 0) {
                const newPath = obrPathToSkiaPath(pathCommands, canvasKit);
                const { mergedPath, mergedItems } = cascadingMerge(newPath, candidates, canvasKit);
                newPath.delete();

                if (mergedItems.length > 0) {
                    for (const item of mergedItems)
                        idsToDelete.push(item.id);
                    finalPathCommands = skiaPathToObrPath(mergedPath.toCmds());
                }

                mergedPath.delete();
            }
        }

        const mergeMetaKey = getId('merge');

        await OBR.scene.items.addItems([buildPath()
            .position({ x: 0, y: 0 })
            .layer('FOG')
            .name('Fog Path')
            .fillColor('#222222')
            .strokeColor('#222222')
            .visible(!cut)
            .metadata({ [mergeMetaKey]: { group: mergeGroup, role: 'fog' } })
            .commands(finalPathCommands)
            .build(),
        ]);

        if (idsToDelete.length > 0)
            await OBR.scene.items.deleteItems(idsToDelete);
    }
}
