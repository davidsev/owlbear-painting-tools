import OBR, { type Item, isPath, type Path } from '@owlbear-rodeo/sdk';
import type { MergeGroup } from '../../Metadata/MergeItemMetadata';
import type { ShapeInterface } from '../Shapes/ShapeInterface';
import type { RendererInterface } from './RendererInterface';

export abstract class BaseRenderer implements RendererInterface {

    protected path?: Path;
    protected borderPath?: Path;
    protected guidePath?: Item;
    protected innerLinesPath?: Path;

    abstract allStylesDisabled (hasInnerLines: boolean): boolean;

    abstract startPreview (shape: ShapeInterface): Promise<void>;

    abstract saveFinalShape (shape: ShapeInterface, mergeGroup: MergeGroup): Promise<void>;

    public async updatePreview (shape: ShapeInterface): Promise<void> {

        const [pathCommands, guidePathCommands, innerLinesCommands] = await Promise.all([
            shape.getPathCommands(),
            shape.getGuidePathCommands(),
            shape.getInnerLinesPathCommands(),
        ]);

        const promises = [];
        if (this.path) {
            promises.push(OBR.scene.local.updateItems([this.path.id], ([path]) => {
                if (!path) return;
                if (isPath(path))
                    path.commands = pathCommands;
            }));
        }
        if (this.borderPath) {
            promises.push(OBR.scene.local.updateItems([this.borderPath.id], ([path]) => {
                if (!path) return;
                if (isPath(path))
                    path.commands = pathCommands;
            }));
        }
        if (this.guidePath) {
            promises.push(OBR.scene.local.updateItems([this.guidePath.id], ([path]) => {
                if (!path) return;
                if (isPath(path))
                    path.commands = guidePathCommands || [];
            }));
        }
        if (this.innerLinesPath) {
            promises.push(OBR.scene.local.updateItems([this.innerLinesPath.id], ([path]) => {
                if (!path) return;
                if (isPath(path))
                    path.commands = innerLinesCommands ?? [];
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
        if (this.borderPath) {
            promises.push(OBR.scene.local.deleteItems([this.borderPath.id]));
            this.borderPath = undefined;
        }
        if (this.guidePath) {
            promises.push(OBR.scene.local.deleteItems([this.guidePath.id]));
            this.guidePath = undefined;
        }
        if (this.innerLinesPath) {
            promises.push(OBR.scene.local.deleteItems([this.innerLinesPath.id]));
            this.innerLinesPath = undefined;
        }

        await Promise.all(promises);
    }
}
