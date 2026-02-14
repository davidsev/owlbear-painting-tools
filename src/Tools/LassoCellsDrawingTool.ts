import type { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { DrawingRenderer } from './Renderers/DrawingRenderer';
import { LassoCellsShape } from './Shapes/LassoCellsShape';

export class LassoCellsDrawingTool extends BaseTool<DrawingRenderer, LassoCellsShape> {

    readonly id: string = getId('lassoCellsDrawing');
    readonly icons: ToolIcon[] = [{
        icon: `${URL_PREFIX}/lassoCells.svg`,
        label: 'Select Area',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    constructor () {
        super(new DrawingRenderer(), new LassoCellsShape());
    }
}

