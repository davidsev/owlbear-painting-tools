import OBR, { buildPath, isPath, Item, Path } from '@owlbear-rodeo/sdk';
import { grid } from '@davidsev/owlbear-utils';
import { RendererInterface } from './RendererInterface';
import { ShapeInterface } from '../Shapes/ShapeInterface';

export class FogRenderer implements RendererInterface {

    private path?: Path;
    private guidePath?: Item;

    public async startPreview (shape: ShapeInterface): Promise<void> {
        this.removePreview();

        // Get the grid colour to use for the highlight.
        const colour = {
            'LIGHT': '#FFFFFF',
            'DARK': '#000000',
            'HIGHLIGHT': '#FA6400',
        }[grid.style.lineColor] || grid.style.lineColor;

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

    public async updatePreview (shape: ShapeInterface): Promise<void> {

        const [pathCommands, guidePathCommands] = await Promise.all([
            shape.getPathCommands(),
            shape.getGuidePathCommands(),
        ]);

        const promises = [];
        if (this.path) {
            promises.push(OBR.scene.local.updateItems([this.path.id], ([path]) => {
                if (isPath(path))
                    path.commands = pathCommands;
            }));
        }
        if (this.guidePath) {
            promises.push(OBR.scene.local.updateItems([this.guidePath.id], ([path]) => {
                if (isPath(path))
                    path.commands = guidePathCommands || [];
            }));
        }

        await Promise.all(promises);
    }

    public async removePreview (): Promise<void> {
        const promises = [];
        if (this.path) {
            promises.push(OBR.scene.local.deleteItems([this.path.id]));
            this.path = undefined;
        }
        if (this.guidePath) {
            promises.push(OBR.scene.local.deleteItems([this.guidePath.id]));
            this.guidePath = undefined;
        }

        await Promise.all(promises);
    }

    public async saveFinalShape (shape: ShapeInterface): Promise<void> {
        const fogMetadata = await OBR.tool.getMetadata('rodeo.owlbear.tool/fog');
        const cut = !!fogMetadata?.cut;

        await OBR.scene.items.addItems([buildPath()
            .position({ x: 0, y: 0 })
            .layer('FOG')
            .name('Fog Path')
            .fillColor('#222222')
            .strokeColor('#222222')
            .visible(!cut)
            .commands(await shape.getPathCommands())
            .build(),
        ]);
    }
}
