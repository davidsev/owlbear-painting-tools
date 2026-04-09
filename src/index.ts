import { ThemeManager } from '@davidsev/owlbear-ui';
import OBR, { type ToolMode } from '@owlbear-rodeo/sdk';
import { disposeAll, init, registerInitFunction } from './init';
import { LockActionManager } from './LockAll/LockActionManager';
import { BrushDrawingTool } from './Tools/BrushDrawingTool';
import { BrushFogTool } from './Tools/BrushFogTool';
import { LassoCellsDrawingTool } from './Tools/LassoCellsDrawingTool';
import { LassoCellsFogTool } from './Tools/LassoCellsFogTool';
import { SelectCellsDrawingTool } from './Tools/SelectCellsDrawingTool';
import { SelectCellsFogTool } from './Tools/SelectCellsFogTool';
import { BrushSizeForm } from './UI/Forms/BrushSizeForm';
import { SettingsForm } from './UI/SettingsForm';

const HMR_ACTIVE_TOOL_KEY = 'activeToolId';
const HMR_ACTIVE_MODE_KEY = 'activeModeId';
const HMR_DISPOSE_PROMISE_KEY = 'disposePromise';

registerInitFunction('background', async ({ registerDisposer }) => {
    const lockManager = new LockActionManager();
    registerDisposer(() => lockManager.dispose());

    const tools: ToolMode[] = [
        new SelectCellsFogTool(),
        new LassoCellsFogTool(),
        new BrushFogTool(),
        new SelectCellsDrawingTool(),
        new LassoCellsDrawingTool(),
        new BrushDrawingTool(),
    ];
    await Promise.all(tools.map(tool => OBR.tool.createMode(tool)));
    for (const tool of tools)
        registerDisposer(() => OBR.tool.removeMode(tool.id));

    // If we were mid-HMR, re-activate whichever of our modes was active before the swap.
    const hmrData = import.meta.webpackHot?.data;
    if (hmrData) {
        const priorToolId = hmrData[HMR_ACTIVE_TOOL_KEY];
        const priorModeId = hmrData[HMR_ACTIVE_MODE_KEY];
        if (typeof priorToolId === 'string' && typeof priorModeId === 'string'
            && tools.some(t => t.id === priorModeId)) {
            try {
                await OBR.tool.activateMode(priorToolId, priorModeId);
            } catch (err) {
                console.warn('failed to restore active tool mode after HMR', err);
            }
        }
    }
});

registerInitFunction('brush-settings', ({ registerDisposer }) => {
    ThemeManager.getInstance().connectOBR();
    const form = new BrushSizeForm();
    document.body.appendChild(form);
    registerDisposer(() => form.remove());
});

registerInitFunction('settings', ({ registerDisposer }) => {
    ThemeManager.getInstance().connectOBR();
    const form = new SettingsForm();
    document.body.appendChild(form);
    registerDisposer(() => form.remove());
});

// Kick off init. Under HMR, wait for the prior module's disposal to finish
// first — webpack fires dispose handlers synchronously and does NOT await
// async cleanup, so we hand the disposePromise across via webpackHot.data.
async function bootstrap (): Promise<void> {
    const hmrData = import.meta.webpackHot?.data;
    if (hmrData) {
        const priorDispose = hmrData[HMR_DISPOSE_PROMISE_KEY] as Promise<void> | undefined;
        if (priorDispose) await priorDispose;
    }
    await init();
}
bootstrap().catch(err => console.error('bootstrap failed', err));

// HMR: tear everything down before webpack swaps in the new module. The
// callback must be synchronous — webpack ignores returned promises — so we
// fire async work and stash its promise on data for the new module to await.
if (import.meta.webpackHot) {
    import.meta.webpackHot.dispose((data) => {
        // Only the background frame has active tools/modes — popovers don't.
        // Capture must finish before disposeAll runs: removeMode clears the
        // active mode, so asking OBR afterwards would return the fallback.
        const capturePromise = window.location.hash === '#background'
            ? Promise.all([
                OBR.tool.getActiveTool()
                    .catch((err) => { console.warn('capture active tool failed', err); return undefined; }),
                OBR.tool.getActiveToolMode()
                    .catch((err) => { console.warn('capture active mode failed', err); return undefined; }),
            ]).then(([toolId, modeId]) => {
                data[HMR_ACTIVE_TOOL_KEY] = toolId;
                data[HMR_ACTIVE_MODE_KEY] = modeId;
            })
            : Promise.resolve();

        data[HMR_DISPOSE_PROMISE_KEY] = capturePromise.then(() => disposeAll());
    });
    import.meta.webpackHot.accept();
}
