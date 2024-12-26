const Main = imports.ui.main;

function getDisplaySize() {
    return [
        Main.layoutManager.primaryMonitor.width, 
        Main.layoutManager.primaryMonitor.height
    ];
}

function getPanelHeight() {
    return Main.panel.actor.get_height();
}

function getFunctionalDisplaySize() {
    const size = getDisplaySize();
    size[0] -= getPanelHeight();

    return size;
}
