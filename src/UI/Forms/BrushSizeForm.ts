import { customElement, query } from 'lit/decorators.js';
import { html } from 'lit';
import { BaseElement } from '../BaseElement';
import style from './BrushSizeForm.css';
import { baseCSS } from '../baseCSS';

@customElement('brush-size-form')
export class BrushSizeForm extends BaseElement {

    static styles = baseCSS(style);

    @query('input')
    private accessor input!: HTMLInputElement;

    render () {
        return html`
            <main>
                <input type="range" min="0.4" max="2" step="0.1" @change="${this.barChanged}"
                       value="${Math.sqrt(parseFloat(localStorage.getItem('brushRadius') || '0.25') * 2)}"/>
            </main>
        `;
    }

    private barChanged () {
        localStorage.setItem('brushRadius', (Math.pow(this.input.valueAsNumber, 2) / 2).toString());
    }
}

