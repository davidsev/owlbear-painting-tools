import { BaseElement, baseCSS } from '@davidsev/owlbear-ui';
import '@davidsev/owlbear-ui/components/Select';
import '@davidsev/owlbear-ui/components/Input';
import '@davidsev/owlbear-ui/components/HelpTooltip';
import '@davidsev/owlbear-ui/color-picker';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { settings } from '../Settings/Settings';

@customElement('settings-form')
export class SettingsForm extends BaseElement {

    static override styles = baseCSS(`
        :host {
            padding: 8px 12px;
        }

        main {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        h3 {
            margin: 4px 0 2px;
            padding: 4px 8px;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--theme-color);
            background: rgba(var(--text-rgb), 0.05);
            border-radius: 4px;
        }

        h3:first-child {
            margin-top: 0;
        }

        label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75em;
            font-weight: 500;
            color: var(--text-secondary-color);
            cursor: pointer;
        }

        label span {
            flex-shrink: 0;
            min-width: 5em;
        }

        label obui-select,
        label obui-input {
            flex: 1;
        }

        .setting-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .setting-row label {
            flex: 1;
        }

        .custom-controls {
            margin-left: 12px;
            padding-left: 12px;
            border-left: 2px solid var(--theme-color);
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
    `);

    private _onSelect<K extends keyof typeof settings> (key: K) {
        return (e: Event) => {
            (settings[key] as string) = (e.target as HTMLElement & { value: string }).value;
            this.requestUpdate();
        };
    }

    private _onNumber<K extends keyof typeof settings> (key: K) {
        return (e: Event) => {
            (settings[key] as number) = (e.target as HTMLElement & { valueAsNumber: number }).valueAsNumber;
            this.requestUpdate();
        };
    }

    private _onColor (colorKey: keyof typeof settings, opacityKey: keyof typeof settings) {
        return (e: Event) => {
            const target = e.target as HTMLElement & { color: string; opacity: number };
            (settings[colorKey] as string) = target.color;
            (settings[opacityKey] as number) = target.opacity;
            this.requestUpdate();
        };
    }

    override render () {
        return html`
            <main>
                <h3>Auto-merge</h3>

                <div class="setting-row">
                    <label>
                        <span>Drawing</span>
                        <obui-select
                            .options=${{ off: 'Off', on: 'On', matchStyle: 'Match style' }}
                            .value=${settings.autoMergeDrawing}
                            @change=${this._onSelect('autoMergeDrawing')}
                        ></obui-select>
                    </label>
                    <obui-help-tooltip>
                        <p>Only auto-merges with shapes drawn by this extension</p>
                    </obui-help-tooltip>
                </div>

                <div class="setting-row">
                    <label>
                        <span>Fog</span>
                        <obui-select
                            .options=${{ on: 'On', off: 'Off' }}
                            .value=${settings.autoMergeFog}
                            @change=${this._onSelect('autoMergeFog')}
                        ></obui-select>
                    </label>
                    <obui-help-tooltip>
                        <p>Only auto-merges with shapes drawn by this extension</p>
                    </obui-help-tooltip>
                </div>

                <h3>Drawing style</h3>

                <label>
                    <span>Border</span>
                    <obui-select
                        .options=${{ off: 'Off', stroke: 'Use Owlbear stroke style', custom: 'Custom' }}
                        .value=${settings.borderMode}
                        @change=${this._onSelect('borderMode')}
                    ></obui-select>
                </label>

                ${settings.borderMode === 'custom' ? html`
                    <div class="custom-controls">
                        <label>
                            <span>Color</span>
                            <obui-color-picker
                                .color=${settings.borderColor}
                                .opacity=${settings.borderOpacity}
                                @change=${this._onColor('borderColor', 'borderOpacity')}
                            ></obui-color-picker>
                        </label>
                        <label>
                            <span>Width</span>
                            <obui-input
                                type="number"
                                min="1"
                                max="10"
                                .value=${String(settings.borderWidth)}
                                @change=${this._onNumber('borderWidth')}
                            ></obui-input>
                        </label>
                        <label>
                            <span>Style</span>
                            <obui-select
                                .options=${{ solid: 'Solid', dashed: 'Dashed' }}
                                .value=${settings.borderStyle}
                                @change=${this._onSelect('borderStyle')}
                            ></obui-select>
                        </label>
                    </div>
                ` : nothing}

                <label>
                    <span>Fill</span>
                    <obui-select
                        .options=${{ off: 'Off', fill: 'Use Owlbear fill style', custom: 'Custom' }}
                        .value=${settings.fillMode}
                        @change=${this._onSelect('fillMode')}
                    ></obui-select>
                </label>

                ${settings.fillMode === 'custom' ? html`
                    <div class="custom-controls">
                        <label>
                            <span>Color</span>
                            <obui-color-picker
                                .color=${settings.fillColor}
                                .opacity=${settings.fillOpacity}
                                @change=${this._onColor('fillColor', 'fillOpacity')}
                            ></obui-color-picker>
                        </label>
                    </div>
                ` : nothing}

                <label>
                    <span>Inner lines</span>
                    <obui-select
                        .options=${{ off: 'Off', stroke: 'Use Owlbear stroke style', custom: 'Custom' }}
                        .value=${settings.innerLinesMode}
                        @change=${this._onSelect('innerLinesMode')}
                    ></obui-select>
                </label>

                ${settings.innerLinesMode === 'custom' ? html`
                    <div class="custom-controls">
                        <label>
                            <span>Color</span>
                            <obui-color-picker
                                .color=${settings.innerLinesColor}
                                .opacity=${settings.innerLinesOpacity}
                                @change=${this._onColor('innerLinesColor', 'innerLinesOpacity')}
                            ></obui-color-picker>
                        </label>
                        <label>
                            <span>Width</span>
                            <obui-input
                                type="number"
                                min="1"
                                max="10"
                                .value=${String(settings.innerLinesWidth)}
                                @change=${this._onNumber('innerLinesWidth')}
                            ></obui-input>
                        </label>
                        <label>
                            <span>Style</span>
                            <obui-select
                                .options=${{ solid: 'Solid', dashed: 'Dashed' }}
                                .value=${settings.innerLinesStyle}
                                @change=${this._onSelect('innerLinesStyle')}
                            ></obui-select>
                        </label>
                    </div>
                ` : nothing}
            </main>
        `;
    }
}
