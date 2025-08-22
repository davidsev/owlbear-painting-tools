import OBR from '@owlbear-rodeo/sdk';
import { LockAllAction } from './LockAllAction';
import { UnlockAllAction } from './UnlockAllAction';
import { lockSceneMetadata } from '../Metadata/LockSceneMetadata';

export class LockActionManager {

    private readonly lockAction: LockAllAction;
    private readonly unlockAction: UnlockAllAction;

    constructor () {
        this.lockAction = new LockAllAction();
        this.unlockAction = new UnlockAllAction();

        OBR.scene.onReadyChange(this.sceneChanged.bind(this));
        OBR.scene.isReady().then(this.sceneChanged.bind(this));
        OBR.scene.onMetadataChange(this.sceneChanged.bind(this, true));
    }

    private async sceneChanged (ready: boolean): Promise<void> {
        if (!ready)
            await this.removeAction();
        else
            await this.addAction();
    }

    private async removeAction (): Promise<void> {
        await Promise.all([
            OBR.tool.removeAction(this.lockAction.id),
            OBR.tool.removeAction(this.unlockAction.id),
        ]);
    }

    private async addAction (): Promise<void> {
        await this.removeAction();
        if (lockSceneMetadata.data.isLocked)
            await OBR.tool.createAction(this.unlockAction);
        else
            await OBR.tool.createAction(this.lockAction);
    }

}
