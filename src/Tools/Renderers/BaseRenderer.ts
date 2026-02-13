import OBR, { isPath, Item, Path } from '@owlbear-rodeo/sdk';
import { RendererInterface } from './RendererInterface';
import { ShapeInterface } from '../Shapes/ShapeInterface';

export abstract class BaseRenderer implements RendererInterface {

    protected path?: Path;
    protected guidePath?: Item;

    abstract startPreview (shape: ShapeInterface): Promise<void>;

    abstract saveFinalShape (shape: ShapeInterface): Promise<void>;

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
}
