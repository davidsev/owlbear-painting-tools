import { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { BrushShape } from './Shapes/BrushShape';
import { ToolContext, ToolEvent } from '@owlbear-rodeo/sdk/lib/types/Tool';
import { FogRenderer } from './Renderers/FogRenderer';

export class BrushFogTool extends BaseTool<FogRenderer, BrushShape> {

    readonly id: string = getId('brushFog');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/brush.svg',
        label: 'Brush',
        filter: {
            activeTools: ['rodeo.owlbear.tool/fog'],
        },
    }];

    constructor () {
        super(new FogRenderer(), new BrushShape());
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
