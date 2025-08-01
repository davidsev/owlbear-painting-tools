import { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { SelectCellsShape } from './Shapes/SelectCellsShape';
import { DrawingRenderer } from './Renderers/DrawingRenderer';

export class SelectCellsDrawingTool extends BaseTool {

    readonly id: string = getId('highlightCellsDrawing');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/selectCells.svg',
        label: 'Select Cells',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    constructor () {
        super(new DrawingRenderer(), new SelectCellsShape());
    }
}
