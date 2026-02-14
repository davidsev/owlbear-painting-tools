import { grid } from '@davidsev/owlbear-utils';
import OBR, { buildPath } from '@owlbear-rodeo/sdk';
import { getGridColor } from '../../Utils/getGridColor';
import type { ShapeInterface } from '../Shapes/ShapeInterface';
import { BaseRenderer } from './BaseRenderer';

export class FogRenderer extends BaseRenderer {

    public async startPreview (shape: ShapeInterface): Promise<void> {
        this.removePreview();

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

    public async saveFinalShape (shape: ShapeInterface): Promise<void> {
        const [pathCommands, fogMetadata] = await Promise.all([
            shape.getPathCommands(),
            OBR.tool.getMetadata('rodeo.owlbear.tool/fog'),
        ]);
        const cut = !!fogMetadata?.cut;

        await OBR.scene.items.addItems([buildPath()
            .position({ x: 0, y: 0 })
            .layer('FOG')
            .name('Fog Path')
            .fillColor('#222222')
            .strokeColor('#222222')
            .visible(!cut)
            .commands(pathCommands)
            .build(),
        ]);
    }
}
