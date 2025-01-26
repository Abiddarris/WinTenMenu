function getBackgroundColor(applet) {
    return applet.preferences.customStartMenuColor ?
        fromCSSColor(applet.preferences.startMenuColor) :
        getThemeColor(applet);
}

function getHoveredColor(applet) {
    const color = getBackgroundColor(applet);
    _adjustLightness(color, 0.1 * (_isDarkMode(color) ? 1 : -1));
    
    return color;
}

function _isDarkMode(color) {
    const r = _applyGammaCorrection(color.r / 255);
    const g = _applyGammaCorrection(color.g / 255);
    const b = _applyGammaCorrection(color.b / 255);
    
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 0.5;
}

function _applyGammaCorrection(c) {
    return c <= 0.03928 ? (c / 12.92) : Math.pow((c + 0.055) / 1.055, 2.4);
}

function _adjustLightness(color, factor) {
    const hsl = _rgbToHsl(color.r, color.g, color.b);
    hsl[2] = Math.max(0, Math.min(1, hsl[2] + factor));
    
    const rgb = _hslToRgb(hsl[0], hsl[1], hsl[2]);
    color.r = rgb[0];
    color.g = rgb[1];
    color.b = rgb[2];
}

function _rgbToHsl(r, g, b) {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;

    const max = Math.max(rf, Math.max(gf, bf));
    const min = Math.min(rf, Math.min(gf, bf));
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max == rf) {
            h = (gf - bf) / d + (gf < bf ? 6 : 0);
        } else if (max == gf) {
            h = (bf - rf) / d + 2;
        } else {
            h = (rf - gf) / d + 4;
        }
        h /= 6;
    }

    return [h, s, l];
}

function _hslToRgb(h, s, l) {
    let r, g, b;
    if (s == 0) {
        r = g = b = l;
    } else {
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = _hueToRgb(p, q, h + 1 / 3);
        g = _hueToRgb(p, q, h);
        b = _hueToRgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function _hueToRgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }

    if (t > 1) {
        t -= 1;
    }

    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }

    if (t < 1 / 2) {
        return q;
    }

    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }

    return p;
}

function getThemeColor(applet) {
    return new Color(255, 255, 255, 255);
}

function _fromColor(color) {
    return new Color(color.red, color.green, color.blue, color.alpha);
}

function fromCSSColor(color) {
    if (!color.startsWith("rgb")) {
        return null;
    }

    color = color.substring(color.indexOf("(") + 1, color.indexOf(")"));
    color = color.split(",");
    
    return new Color(
        color[0], color[1], color[2],
        color.length == 4 ? Math.round(color[3] * 255) : 255
    );
}

class Color {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toCSSColor() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`
    }
}
