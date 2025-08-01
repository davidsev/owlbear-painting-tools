import { ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { BaseTool } from './BaseTool';
import { FogRenderer } from './Renderers/FogRenderer';
import { SelectCellsShape } from './Shapes/SelectCellsShape';

export class SelectCellsFogTool extends BaseTool {

    readonly id: string = getId('highlightCellsFog');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/selectCells.svg',
        label: 'Select Cells',
        filter: {
            activeTools: ['rodeo.owlbear.tool/fog'],
        },
    }];

    constructor () {
        super(new FogRenderer(), new SelectCellsShape());
    }
}
