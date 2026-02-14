import type { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseBrushTool } from './BaseBrushTool';
import { DrawingRenderer } from './Renderers/DrawingRenderer';

export class BrushDrawingTool extends BaseBrushTool<DrawingRenderer> {

    readonly id: string = getId('brushDrawing');
    readonly icons: ToolIcon[] = [{
        icon: `${URL_PREFIX}/brush.svg`,
        label: 'Brush',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    constructor () {
        super(new DrawingRenderer());
    }
}
