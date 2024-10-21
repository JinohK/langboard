const HRANGE: [number, number] = [0, 360];
const SRANGE: [number, number] = [40, 60];
const LRANGE: [number, number] = [40, 60];

export const hslToHex = (h: number, s: number, l: number): string => {
    h = h % 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = Math.round(l * 255);
    } else {
        const hueToRgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = Math.round(hueToRgb(p, q, h / 360 + 1 / 3) * 255);
        g = Math.round(hueToRgb(p, q, h / 360) * 255);
        b = Math.round(hueToRgb(p, q, h / 360 - 1 / 3) * 255);
    }

    const toHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hexToRgb = (hex: string): [number, number, number] => {
    const hexWithoutHash = hex.replace("#", "");

    const r = parseInt(hexWithoutHash.slice(0, 2), 16);
    const g = parseInt(hexWithoutHash.slice(2, 4), 16);
    const b = parseInt(hexWithoutHash.slice(4, 6), 16);

    return [r, g, b];
};

export const getTextColorFromHex = (hex: string): "#000" | "#fff" => {
    const [r, g, b] = hexToRgb(hex);
    const o = Math.round((r * 299 + g * 587 + b * 114) / 1000);

    if (o > 125) {
        return "#000";
    } else {
        return "#fff";
    }
};

export const generateRandomColor = (input: string): [string, string] => {
    const hash = input.split("").reduce((hash, letter) => {
        return letter.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);

    const h = Math.floor(hash % HRANGE[1]);
    const s = Math.floor((hash % (SRANGE[1] - SRANGE[0])) + SRANGE[0]);
    const l = Math.floor((hash % (LRANGE[1] - LRANGE[0])) + LRANGE[0]);

    const hex = hslToHex(h, s, l);

    return [hex, getTextColorFromHex(hex)];
};
