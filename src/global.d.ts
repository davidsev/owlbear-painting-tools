declare const URL_PREFIX: string;
declare const VERSION: string;

declare module '*.css';

// Minimal type for webpack's HMR API on import.meta.
// Injected by webpack-dev-server at runtime when --hot is enabled.
interface ImportMeta {
    readonly webpackHot?: {
        /** Data passed from the previous module's dispose handler. Empty object on first load. */
        readonly data?: Record<string, unknown>;
        accept(): void;
        accept(dependencies: string | string[], callback?: (updatedDependencies: string[]) => void): void;
        dispose(callback: (data: Record<string, unknown>) => void | Promise<void>): void;
    };
}
