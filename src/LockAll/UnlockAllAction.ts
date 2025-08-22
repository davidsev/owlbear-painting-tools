import OBR, { Item, ToolAction, ToolContext, ToolIcon } from '@owlbear-rodeo/sdk';
import getId from '../Utils/getId';
import { lockSceneMetadata } from '../Metadata/LockSceneMetadata';
import { lockItemMetadataMapper } from '../Metadata/LockItemMetadata';

export class UnlockAllAction implements ToolAction {
    public readonly id = getId('unlockAllAction');
    readonly icons: ToolIcon[] = [{
        icon: URL_PREFIX + '/unlock.svg',
        label: 'Unlock All Drawing',
        filter: {
            activeTools: ['rodeo.owlbear.tool/drawing'],
        },
    }];

    async onClick (context: ToolContext) {
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
