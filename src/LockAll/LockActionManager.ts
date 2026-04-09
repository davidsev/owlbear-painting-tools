import OBR from '@owlbear-rodeo/sdk';
import { lockSceneMetadata } from '../Metadata/LockSceneMetadata';
import { LockAllAction } from './LockAllAction';
import { UnlockAllAction } from './UnlockAllAction';

export class LockActionManager {

    private readonly lockAction: LockAllAction;
    private readonly unlockAction: UnlockAllAction;
    private readonly unsubscribers: Array<() => void> = [];
    private disposed = false;

    constructor () {
        this.lockAction = new LockAllAction();
        this.unlockAction = new UnlockAllAction();

        this.unsubscribers.push(OBR.scene.onReadyChange(this.sceneChanged.bind(this)));
        // Fire-and-forget: if dispose() runs before this resolves, sceneChanged/addAction
        // bail on the `disposed` flag so they don't recreate a stale action post-cleanup.
        OBR.scene.isReady().then(this.sceneChanged.bind(this));
        this.unsubscribers.push(OBR.scene.onMetadataChange(this.sceneChanged.bind(this, true)));
    }

    async dispose (): Promise<void> {
        this.disposed = true;
        for (const unsubscribe of this.unsubscribers)
            unsubscribe();
        this.unsubscribers.length = 0;
        await this.removeAction();
    }

    private async sceneChanged (ready: boolean): Promise<void> {
        if (this.disposed) return;
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
        if (this.disposed) return;
        if (lockSceneMetadata.data.isLocked)
            await OBR.tool.createAction(this.unlockAction);
        else
            await OBR.tool.createAction(this.lockAction);
    }

}
