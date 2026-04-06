import type { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { DrawingRenderer } from './Renderers/DrawingRenderer';
import { SelectCellsShape } from './Shapes/SelectCellsShape';

export class SelectCellsDrawingTool extends BaseTool<DrawingRenderer, SelectCellsShape> {

    readonly id: string = getId('highlightCellsDrawing');
    readonly mergeGroup = 'cells' as const;
    readonly icons: ToolIcon[] = [{
        icon: `${URL_PREFIX}/selectCells.svg`,
        label: 'Select Cells',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];
    protected override readonly hasInnerLines = true;

    constructor () {
        super(new DrawingRenderer(), new SelectCellsShape());
    }
}
