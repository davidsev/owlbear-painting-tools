import { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { DrawingRenderer } from './Renderers/DrawingRenderer';
import { BrushShape } from './Shapes/BrushShape';
import { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';

export class BrushDrawingTool extends BaseTool<DrawingRenderer, BrushShape> {

    readonly id: string = getId('brushDrawing');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/brush.svg',
        label: 'Brush',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    constructor () {
        super(new DrawingRenderer(), new BrushShape());
    }

    // When the tool is activated, show the settings popup and the cursor.
    public async onActivate (): Promise<void> {
        await Promise.all([
            this.shape.showSettingsPopup(),
            this.shape.showCursor(),
        ]);
    }

    // When the tool is deactivated, hide the settings popup and the cursor.
    public async onDeactivate (): Promise<void> {
        this.shape.hideCursor();
        await this.shape.hideSettingsPopup();
    }

    public onToolMove (context: ToolContext, event: ToolEvent): void {
        this.shape.updateCursor(event.pointerPosition);
    }
}
