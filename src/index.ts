import { registerInitFunction } from './init';
import OBR from '@owlbear-rodeo/sdk';
import { SelectCellsFogTool } from './Tools/SelectCellsFogTool';
import { LassoCellsFogTool } from './Tools/LassoCellsFogTool';
import { SelectCellsDrawingTool } from './Tools/SelectCellsDrawingTool';
import { LassoCellsDrawingTool } from './Tools/LassoCellsDrawingTool';

registerInitFunction('background', async () => {
    return Promise.all([
        OBR.tool.createMode(new SelectCellsFogTool()),
        OBR.tool.createMode(new LassoCellsFogTool()),
        OBR.tool.createMode(new SelectCellsDrawingTool()),
        OBR.tool.createMode(new LassoCellsDrawingTool()),
    ]);
});
