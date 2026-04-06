import { drawingToolMetadata } from '../Metadata/DrawingToolMetadata';

export type OnOff = 'on' | 'off';
export type BorderMode = 'off' | 'stroke' | 'custom';
export type FillMode = 'off' | 'fill' | 'custom';
export type InnerLinesMode = 'off' | 'stroke' | 'custom';
export type LineStyle = 'solid' | 'dashed';

export interface StrokeStyle {
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity: number;
    strokeDash: number[];
}

export interface FillStyle {
    fillColor: string;
    fillOpacity: number;
}

const STORAGE_PREFIX = 'settings.';

const onOffValues = ['on', 'off'] as const;
const borderModeValues = ['off', 'stroke', 'custom'] as const;
const fillModeValues = ['off', 'fill', 'custom'] as const;
const innerLinesModeValues = ['off', 'stroke', 'custom'] as const;
const lineStyleValues = ['solid', 'dashed'] as const;

class Settings {

    // ---- Private helpers ----

    private _getEnum<T extends string> (key: string, allowed: readonly T[], defaultValue: T): T {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw !== null && (allowed as readonly string[]).includes(raw))
            return raw as T;
        return defaultValue;
    }

    private _setEnum<T extends string> (key: string, allowed: readonly T[], value: T, defaultValue: T): void {
        if (!(allowed as readonly string[]).includes(value)) {
            console.log(`Invalid value '${value}' for setting '${key}', using default '${defaultValue}'`);
            value = defaultValue;
        }
        localStorage.setItem(STORAGE_PREFIX + key, value);
    }

    private _getNumber (key: string, defaultValue: number, min?: number, max?: number): number {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null) return defaultValue;
        const num = Number(raw);
        if (Number.isNaN(num)) return defaultValue;
        if (min !== undefined && num < min) return defaultValue;
        if (max !== undefined && num > max) return defaultValue;
        return num;
    }

    private _setNumber (key: string, value: number, min?: number, max?: number): void {
        if (min !== undefined && value < min) value = min;
        if (max !== undefined && value > max) value = max;
        localStorage.setItem(STORAGE_PREFIX + key, String(value));
    }

    private _getString (key: string, defaultValue: string): string {
        return localStorage.getItem(STORAGE_PREFIX + key) ?? defaultValue;
    }

    private _setString (key: string, value: string): void {
        localStorage.setItem(STORAGE_PREFIX + key, value);
    }

    private _lineStyleToDash (style: LineStyle, width: number): number[] {
        switch (style) {
            case 'solid': return [];
            case 'dashed': return [5 * width, 5 * width];
        }
    }

    private _resolveObrDash (strokeDash: number[], strokeWidth: number): number[] {
        return strokeDash.map(x => x * strokeWidth);
    }

    // ---- Brush settings ----

    get brushRadius (): number {
        return this._getNumber('brushRadius', 0.25, 0.01, 5);
    }

    set brushRadius (value: number) {
        this._setNumber('brushRadius', value, 0.01, 5);
    }

    // ---- Auto-merge settings ----

    get autoMergeDrawing (): OnOff {
        return this._getEnum('autoMergeDrawing', onOffValues, 'off');
    }

    set autoMergeDrawing (value: OnOff) {
        this._setEnum('autoMergeDrawing', onOffValues, value, 'off');
    }

    get autoMergeFog (): OnOff {
        return this._getEnum('autoMergeFog', onOffValues, 'off');
    }

    set autoMergeFog (value: OnOff) {
        this._setEnum('autoMergeFog', onOffValues, value, 'off');
    }

    // ---- Border settings ----

    get borderMode (): BorderMode {
        return this._getEnum('borderMode', borderModeValues, 'stroke');
    }

    set borderMode (value: BorderMode) {
        this._setEnum('borderMode', borderModeValues, value, 'stroke');
    }

    get borderColor (): string {
        return this._getString('borderColor', '#000000');
    }

    set borderColor (value: string) {
        this._setString('borderColor', value);
    }

    get borderOpacity (): number {
        return this._getNumber('borderOpacity', 1, 0, 1);
    }

    set borderOpacity (value: number) {
        this._setNumber('borderOpacity', value, 0, 1);
    }

    get borderWidth (): number {
        return this._getNumber('borderWidth', 2, 1, 10);
    }

    set borderWidth (value: number) {
        this._setNumber('borderWidth', value, 1, 10);
    }

    get borderStyle (): LineStyle {
        return this._getEnum('borderStyle', lineStyleValues, 'solid');
    }

    set borderStyle (value: LineStyle) {
        this._setEnum('borderStyle', lineStyleValues, value, 'solid');
    }

    // ---- Fill settings ----

    get fillMode (): FillMode {
        return this._getEnum('fillMode', fillModeValues, 'fill');
    }

    set fillMode (value: FillMode) {
        this._setEnum('fillMode', fillModeValues, value, 'fill');
    }

    get fillColor (): string {
        return this._getString('fillColor', '#000000');
    }

    set fillColor (value: string) {
        this._setString('fillColor', value);
    }

    get fillOpacity (): number {
        return this._getNumber('fillOpacity', 1, 0, 1);
    }

    set fillOpacity (value: number) {
        this._setNumber('fillOpacity', value, 0, 1);
    }

    // ---- Inner lines settings ----

    get innerLinesMode (): InnerLinesMode {
        return this._getEnum('innerLinesMode', innerLinesModeValues, 'off');
    }

    set innerLinesMode (value: InnerLinesMode) {
        this._setEnum('innerLinesMode', innerLinesModeValues, value, 'off');
    }

    get innerLinesColor (): string {
        return this._getString('innerLinesColor', '#000000');
    }

    set innerLinesColor (value: string) {
        this._setString('innerLinesColor', value);
    }

    get innerLinesOpacity (): number {
        return this._getNumber('innerLinesOpacity', 1, 0, 1);
    }

    set innerLinesOpacity (value: number) {
        this._setNumber('innerLinesOpacity', value, 0, 1);
    }

    get innerLinesWidth (): number {
        return this._getNumber('innerLinesWidth', 1, 1, 10);
    }

    set innerLinesWidth (value: number) {
        this._setNumber('innerLinesWidth', value, 1, 10);
    }

    get innerLinesStyle (): LineStyle {
        return this._getEnum('innerLinesStyle', lineStyleValues, 'solid');
    }

    set innerLinesStyle (value: LineStyle) {
        this._setEnum('innerLinesStyle', lineStyleValues, value, 'solid');
    }

    // ---- Resolved helpers ----

    private async _resolveStroke (mode: 'off' | 'stroke' | 'custom', custom: () => StrokeStyle): Promise<StrokeStyle | null> {
        switch (mode) {
            case 'off':
                return null;
            case 'stroke': {
                const meta = await drawingToolMetadata.get();
                return {
                    strokeColor: meta.strokeColor,
                    strokeWidth: meta.strokeWidth,
                    strokeOpacity: meta.strokeOpacity,
                    strokeDash: this._resolveObrDash(meta.strokeDash, meta.strokeWidth),
                };
            }
            case 'custom':
                return custom();
        }
    }

    async resolvedBorder (): Promise<StrokeStyle | null> {
        return this._resolveStroke(this.borderMode, () => ({
            strokeColor: this.borderColor,
            strokeWidth: this.borderWidth,
            strokeOpacity: this.borderOpacity,
            strokeDash: this._lineStyleToDash(this.borderStyle, this.borderWidth),
        }));
    }

    async resolvedFill (): Promise<FillStyle | null> {
        switch (this.fillMode) {
            case 'off':
                return null;
            case 'fill': {
                const meta = await drawingToolMetadata.get();
                return {
                    fillColor: meta.fillColor,
                    fillOpacity: meta.fillOpacity,
                };
            }
            case 'custom':
                return {
                    fillColor: this.fillColor,
                    fillOpacity: this.fillOpacity,
                };
        }
    }

    async resolvedInnerLines (): Promise<StrokeStyle | null> {
        return this._resolveStroke(this.innerLinesMode, () => ({
            strokeColor: this.innerLinesColor,
            strokeWidth: this.innerLinesWidth,
            strokeOpacity: this.innerLinesOpacity,
            strokeDash: this._lineStyleToDash(this.innerLinesStyle, this.innerLinesWidth),
        }));
    }
}

export const settings = new Settings();
