import { grid } from '@davidsev/owlbear-utils';
import OBR, { buildPath } from '@owlbear-rodeo/sdk';
import { drawingToolMetadata } from '../../Metadata/DrawingToolMetadata';
import { getGridColor } from '../../Utils/getGridColor';
import type { ShapeInterface } from '../Shapes/ShapeInterface';
import { BaseRenderer } from './BaseRenderer';

export class DrawingRenderer extends BaseRenderer {

    public async startPreview (shape: ShapeInterface): Promise<void> {
        this.removePreview();

        const [pathCommands, guidePathCommands, drawingMetadata] = await Promise.all([
            shape.getPathCommands(),
            shape.getGuidePathCommands(),
            drawingToolMetadata.get(),
        ]);

        this.path = buildPath()
            .position({ x: 0, y: 0 })
            .locked(true)
            .strokeColor(drawingMetadata.strokeColor)
            .strokeWidth(drawingMetadata.strokeWidth)
            .strokeOpacity(drawingMetadata.strokeOpacity)
            .strokeDash(drawingMetadata.strokeDash.map(x => x * drawingMetadata.strokeWidth))
            .fillOpacity(drawingMetadata.fillOpacity)
            .fillColor(drawingMetadata.fillColor)
            .fillRule('evenodd')
            .disableHit(true)
            .layer('POPOVER')
            .commands(pathCommands)
            .build();

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

        await Promise.all([
            OBR.scene.local.addItems([this.path]),
            this.guidePath ? OBR.scene.local.addItems([this.guidePath]) : Promise.resolve(),
        ]);
    }

    public async saveFinalShape (shape: ShapeInterface): Promise<void> {
        const [pathCommands, drawingMetadata] = await Promise.all([
            shape.getPathCommands(),
            drawingToolMetadata.get(),
        ]);

        await OBR.scene.items.addItems([buildPath()
            .position({ x: 0, y: 0 })
            .layer('DRAWING')
            .strokeColor(drawingMetadata.strokeColor)
            .strokeWidth(drawingMetadata.strokeWidth)
            .strokeOpacity(drawingMetadata.strokeOpacity)
            .strokeDash(drawingMetadata.strokeDash.map(x => x * drawingMetadata.strokeWidth))
            .fillOpacity(drawingMetadata.fillOpacity)
            .fillColor(drawingMetadata.fillColor)
            .fillRule('evenodd')
            .commands(pathCommands)
            .build(),
        ]);
    }
}
