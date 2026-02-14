import OBR, { buildShape, isShape, type Shape, type Vector2 } from '@owlbear-rodeo/sdk';
import type { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import type { RendererInterface } from './Renderers/RendererInterface';
import { BrushShape } from './Shapes/BrushShape';

export abstract class BaseBrushTool<RendererType extends RendererInterface> extends BaseTool<RendererType, BrushShape> {

    constructor (renderer: RendererType) {
        super(renderer, new BrushShape());
    }

    // When the tool is activated, show the settings popup and the cursor.
    public async onActivate (): Promise<void> {
        await Promise.all([
            this.showSettingsPopup(),
            this.showCursor(),
        ]);
    }

    // When the tool is deactivated, hide the settings popup and the cursor.
    public async onDeactivate (): Promise<void> {
        this.hideCursor();
        await this.hideSettingsPopup();
    }

    public onToolMove (_context: ToolContext, event: ToolEvent): void {
        this.updateCursor(event.pointerPosition);
    }

    //
    // Settings popup
    //

    private async showSettingsPopup (): Promise<void> {
        await OBR.popover.open({
            id: getId('brush-settings'),
            url: `${URL_PREFIX}/frame.html#brush-settings`,
            height: 40,
            width: 250,
            disableClickAway: true,
            anchorOrigin: {
                horizontal: 'CENTER',
                vertical: 'TOP',
            },
            marginThreshold: 56,
        });
    }

    private async hideSettingsPopup (): Promise<void> {
        await OBR.popover.close(getId('brush-settings'));
    }

    //
    // Cursor
    //

    private cursor: Shape | null = null;

    private async showCursor (): Promise<void> {
        if (this.cursor)
            this.hideCursor();

        this.cursor = buildShape()
            .strokeColor('#AAAAAA')
            .fillOpacity(0)
            .strokeWidth(3)
            .disableHit(true)
            .layer('POPOVER')
            .shapeType('CIRCLE')
            .build();

        await OBR.scene.local.addItems([this.cursor]);
    }

    private hideCursor (): void {
        if (this.cursor) {
            // We don't handle this promise because we don't care if the cursor is deleted successfully.
            // On success there's nothing to do, and if it fails there's nothing we can do.  It's a local item so will clean itself up on refresh.
            OBR.scene.local.deleteItems([this.cursor.id]);
            this.cursor = null;
        }
    }

    private _inUpdate: boolean = false;

    private async updateCursor (point: Vector2): Promise<void> {
        if (!this.cursor || this._inUpdate)
            return;

        this._inUpdate = true;
        try {
            await OBR.scene.local.updateItems([this.cursor.id], ([cursor]) => {
                if (isShape(cursor)) {
                    cursor.position = point;
                    cursor.width = this.shape.radius * 2;
                    cursor.height = this.shape.radius * 2;
                }
            });
        } finally {
            this._inUpdate = false;
        }
    }
}
