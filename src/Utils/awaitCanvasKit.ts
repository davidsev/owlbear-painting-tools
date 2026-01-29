import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm';

let canvasKit: CanvasKit | null = null;
let loadError: Error | null = null;
const promises: { resolve: (ck: CanvasKit) => void; reject: (err: Error) => void }[] = [];

/** Convenience function to await the loading of the canvaskit library.
 *  CanvasKit has a wonky loading method that can only be accessed once, so this is a way to make it
 *  globally accessible while still ensuring it's loaded before use.
 */
export async function awaitCanvasKit (): Promise<CanvasKit> {
    if (canvasKit)
        return canvasKit;
    if (loadError)
        throw loadError;
    return new Promise((resolve, reject) => {
        promises.push({ resolve, reject });
    });
}

// Load the library, save it, and resolve all promises.
CanvasKitInit()
    .then((ck) => {
        canvasKit = ck;
        for (const { resolve } of promises)
            resolve(ck);
    })
    .catch((error) => {
        loadError = error;
        for (const { reject } of promises)
            reject(error);
    });
