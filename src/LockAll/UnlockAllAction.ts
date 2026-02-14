import OBR, { type Item, type ToolAction, type ToolContext, type ToolIcon } from '@owlbear-rodeo/sdk';
import { lockItemMetadataMapper } from '../Metadata/LockItemMetadata';
import { lockSceneMetadata } from '../Metadata/LockSceneMetadata';
import getId from '../Utils/getId';

export class UnlockAllAction implements ToolAction {
    public readonly id = getId('unlockAllAction');
    readonly icons: ToolIcon[] = [{
        icon: `${URL_PREFIX}/unlock.svg`,
        label: 'Unlock All Drawing',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    async onClick (_context: ToolContext) {
        lockSceneMetadata.set({ isLocked: false });
        await OBR.scene.items.updateItems(shouldUnlock, (items) => {
            for (const item of items) {
                item.locked = false;
                lockItemMetadataMapper.set(item, { isLocked: undefined });
            }
        });
    }
}

function shouldUnlock (item: Item) {
    return lockItemMetadataMapper.get(item).isLocked;
}
