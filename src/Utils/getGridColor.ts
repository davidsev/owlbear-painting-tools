export function getGridColor (lineColor: string): string {
    return {
        'LIGHT': '#FFFFFF',
        'DARK': '#000000',
        'HIGHLIGHT': '#FA6400',
    }[lineColor] || lineColor;
}
