import { grid } from '@davidsev/owlbear-utils';

export type Disposer = () => void | Promise<void>;
export type InitContext = {
    /** Register a teardown callback. Runs in reverse order on dispose. */
    registerDisposer: (dispose: Disposer) => void;
};
export type InitFunction = (context: InitContext) => void | Promise<void>;

const functions: Map<string, InitFunction> = new Map<string, InitFunction>();
const disposers: Disposer[] = [];
let initPromise: Promise<void> | null = null;

export function registerInitFunction (name: string, callback: InitFunction) {
    functions.set(name, callback);
}

function registerDisposer (dispose: Disposer) {
    disposers.push(dispose);
}

export async function init (): Promise<void> {
    initPromise = (async () => {
        await grid.awaitReady();

        const id = window.location.hash.slice(1);
        const callback = functions.get(id);
        if (callback)
            await callback({ registerDisposer });
    })().catch(err => console.error('init failed', err));
    await initPromise;
}

/** Tear down everything this init registered. Safe to call multiple times. */
export async function disposeAll (): Promise<void> {
    // Make sure any in-flight init has settled before we start removing things.
    if (initPromise) {
        try { await initPromise; } catch { /* init errors already logged */ }
    }
    // Snapshot + reverse so later-registered things tear down first, and so
    // anything that (mis)behaves and re-registers during dispose is ignored.
    const toRun = disposers.splice(0).reverse();
    for (const dispose of toRun) {
        try {
            await dispose();
        } catch (err) {
            console.error('disposer failed', err);
        }
    }
    initPromise = null;
}
