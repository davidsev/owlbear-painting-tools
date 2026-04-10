import OBR, { type ToolIcon, type ToolMode } from '@owlbear-rodeo/sdk';
import type { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';
import type { MergeGroup } from '../Metadata/MergeItemMetadata';
import type { RendererInterface } from './Renderers/RendererInterface';
import type { ShapeInterface } from './Shapes/ShapeInterface';

export abstract class BaseTool<RendererType extends RendererInterface, ShapeType extends ShapeInterface> implements ToolMode {

    abstract readonly id: string;
    abstract readonly icons: ToolIcon[];
    abstract readonly mergeGroup: MergeGroup;
    protected readonly hasInnerLines: boolean = false;

    constructor (
        public readonly renderer: RendererType,
        public readonly shape: ShapeType,
    ) {}

    /** Returns false if activation was rejected (e.g. all styles disabled). */
    async onActivate (): Promise<boolean> {
        if (this.renderer.allStylesDisabled(this.hasInnerLines)) {
            await OBR.notification.show('All drawing styles are disabled. Enable at least one in settings.', 'ERROR');
            // Fall back to the built-in drawing grab mode. Only drawing tools can hit this branch
            // (FogRenderer.allStylesDisabled is hard-coded to false), so the target is fixed.
            await OBR.tool.activateMode('rodeo.owlbear.tool/drawing', 'rodeo.owlbear.tool-mode/drawing/grab');
            return false;
        }
        return true;
    }

    // Coalescing loop: multiple drag-move events are folded into a single updatePreview call.
    // _needsUpdate is set by each drag-move; the while loop drains it when idle.
    private _updating = false;
    private _needsUpdate = false;

    async onToolDragStart (_context: ToolContext, event: ToolEvent): Promise<void> {
        this._updating = false;
        this._needsUpdate = false;
        await this.cleanup();
        await this.shape.add(event.pointerPosition);
        await this.renderer.startPreview(this.shape);
    }

    async onToolDragMove (_context: ToolContext, event: ToolEvent): Promise<void> {
        await this.shape.add(event.pointerPosition);
        this._needsUpdate = true;
        if (this._updating) return;

        this._updating = true;
        try {
            while (this._needsUpdate) {
                this._needsUpdate = false;
                await this.renderer.updatePreview(this.shape);
            }
        } finally {
            this._updating = false;
        }
    }

    async onToolDragEnd (_context: ToolContext, _event: ToolEvent): Promise<void> {
        this._needsUpdate = false;
        await this.renderer.saveFinalShape(this.shape, this.mergeGroup);
        await this.cleanup();
    }

    async onToolDragCancel (): Promise<void> {
        this._needsUpdate = false;
        await this.cleanup();
    }

    private async cleanup (): Promise<void> {
        await Promise.all([
            this.shape.clear(),
            this.renderer.removePreview(),
        ]);
    }
}
