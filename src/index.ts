import { registerInitFunction } from './init';
import OBR from '@owlbear-rodeo/sdk';
import { SelectCellsFogTool } from './Tools/SelectCellsFogTool';
import { LassoCellsFogTool } from './Tools/LassoCellsFogTool';
import { SelectCellsDrawingTool } from './Tools/SelectCellsDrawingTool';
import { LassoCellsDrawingTool } from './Tools/LassoCellsDrawingTool';
import { BrushSizeForm } from './UI/Forms/BrushSizeForm';
import styles from './UI/baseCSS.css';
import './UI';
import { BrushDrawingTool } from './Tools/BrushDrawingTool';
import { BrushFogTool } from './Tools/BrushFogTool';

registerInitFunction('background', async () => {
    return Promise.all([
        OBR.tool.createMode(new SelectCellsFogTool()),
        OBR.tool.createMode(new LassoCellsFogTool()),
        OBR.tool.createMode(new BrushFogTool()),
        OBR.tool.createMode(new SelectCellsDrawingTool()),
        OBR.tool.createMode(new LassoCellsDrawingTool()),
        OBR.tool.createMode(new BrushDrawingTool()),
    ]);
});

registerInitFunction('brush-settings', () => {
    document.body.appendChild(new BrushSizeForm());

    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
});
