import { ToolIcon, ToolMode } from '@owlbear-rodeo/sdk';
import { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';
import { RendererInterface } from './Renderers/RendererInterface';
import { ShapeInterface } from './Shapes/ShapeInterface';

export abstract class BaseTool implements ToolMode {

    abstract readonly id: string;
    abstract readonly icons: ToolIcon[];

    constructor (
        public readonly renderer: RendererInterface,
        public readonly shape: ShapeInterface,
    ) {}

    async onToolDragStart (context: ToolContext, event: ToolEvent): Promise<void> {
        await this.cleanup();
        await this.shape.add(event.pointerPosition);
        await this.renderer.startPreview(this.shape);
    }

    async onToolDragMove (context: ToolContext, event: ToolEvent): Promise<void> {
        await this.shape.add(event.pointerPosition);
        await this.renderer.updatePreview(this.shape);
    }

    async onToolDragEnd (context: ToolContext, event: ToolEvent): Promise<void> {
        await this.renderer.saveFinalShape(this.shape);
        await this.cleanup();
    }

    async onToolDragCancel (): Promise<void> {
        await this.cleanup();
    }

    private async cleanup (): Promise<void> {
        await Promise.all([
            this.shape.clear(),
            this.renderer.removePreview(),
        ]);
    }
}
