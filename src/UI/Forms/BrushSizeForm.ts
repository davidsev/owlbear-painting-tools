import { BaseElement, baseCSS } from '@davidsev/owlbear-ui';
import '@davidsev/owlbear-ui/components/Input';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { settings } from '../../Settings/Settings';

@customElement('brush-size-form')
export class BrushSizeForm extends BaseElement {

    static override styles = baseCSS(`
        :host {
            overflow: hidden;
            padding: 2px 12px 0 12px;
        }
    `);

    @query('obui-input')
    private accessor input!: HTMLElement & { valueAsNumber: number };

    override render () {
        return html`
            <main>
                <obui-input type="range" min="0.4" max="2" step="0.1" @change="${this._onBrushSizeChange}"
                       value="${Math.sqrt(settings.brushRadius * 2)}"></obui-input>
            </main>
        `;
    }

    private _onBrushSizeChange () {
        settings.brushRadius = this.input.valueAsNumber ** 2 / 2;
    }
}
