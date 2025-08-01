import OBR, { buildPath, isPath, Item, Path } from '@owlbear-rodeo/sdk';
import { grid } from '@davidsev/owlbear-utils';
import { RendererInterface } from './RendererInterface';
import { ShapeInterface } from '../Shapes/ShapeInterface';
import { drawingToolMetadata } from '../../Metadata/DrawingToolMetadata';

export class DrawingRenderer implements RendererInterface {

    private path?: Path;
    private guidePath?: Item;

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
            // Get the grid colour to use for the guide path.
            const colour = {
                'LIGHT': '#FFFFFF',
                'DARK': '#000000',
                'HIGHLIGHT': '#FA6400',
            }[grid.style.lineColor] || grid.style.lineColor;
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
            .commands(await shape.getPathCommands())
            .build(),
        ]);
    }
}
