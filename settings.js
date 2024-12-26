const {AppletSettings, BindingDirection} = imports.ui.settings;
const Lang = imports.lang;

function loadSettings(applet, metadata, instanceId) {
    applet.preferences = {};
    applet.settings = new AppletSettings(applet.preferences, metadata["uuid"], instanceId);

    applet.settings.bindProperty(BindingDirection.IN,
                       "menu-width",
                       "menuWidth",
                       Lang.bind(applet.ui, applet.ui.menuWidthChanged),
                       null);
    applet.settings.bindProperty(BindingDirection.IN,
                       "menu-height",
                       "menuHeight",
                       Lang.bind(applet.ui, applet.ui.menuHeightChanged),
                       null);
}
