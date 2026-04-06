import { ThemeManager } from '@davidsev/owlbear-ui';
import OBR from '@owlbear-rodeo/sdk';
import { registerInitFunction } from './init';
import { LockActionManager } from './LockAll/LockActionManager';
import { BrushDrawingTool } from './Tools/BrushDrawingTool';
import { BrushFogTool } from './Tools/BrushFogTool';
import { LassoCellsDrawingTool } from './Tools/LassoCellsDrawingTool';
import { LassoCellsFogTool } from './Tools/LassoCellsFogTool';
import { SelectCellsDrawingTool } from './Tools/SelectCellsDrawingTool';
import { SelectCellsFogTool } from './Tools/SelectCellsFogTool';
import { BrushSizeForm } from './UI/Forms/BrushSizeForm';
import { SettingsForm } from './UI/SettingsForm';

registerInitFunction('background', async () => {
    new LockActionManager();
    await Promise.all([
        OBR.tool.createMode(new SelectCellsFogTool()),
        OBR.tool.createMode(new LassoCellsFogTool()),
        OBR.tool.createMode(new BrushFogTool()),
        OBR.tool.createMode(new SelectCellsDrawingTool()),
        OBR.tool.createMode(new LassoCellsDrawingTool()),
        OBR.tool.createMode(new BrushDrawingTool()),
    ]);
});

registerInitFunction('brush-settings', () => {
    ThemeManager.getInstance().connectOBR();
    document.body.appendChild(new BrushSizeForm());
});

registerInitFunction('settings', () => {
    ThemeManager.getInstance().connectOBR();
    document.body.appendChild(new SettingsForm());
});
