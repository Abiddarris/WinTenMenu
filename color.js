function getBackgroundColor(applet) {
    return applet.preferences.customStartMenuColor ?
        fromCSSColor(applet.preferences.startMenuColor) :
        getThemeColor(applet);
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
