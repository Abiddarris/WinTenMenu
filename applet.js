const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Ui = require('./ui');
const Settings = require('./settings');

class StartMenu extends Applet.TextIconApplet {

    constructor(metadata, orientation, panel_height, instanceId) {
        super(orientation, panel_height, instanceId);

        this.orientation = orientation;
        
        this.set_applet_icon_symbolic_name("start-here");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, this.orientation);
        this.menuManager.addMenu(this.menu);  

        this.ui = new Ui.UI(this);  

        Settings.loadSettings(this, metadata, instanceId);

        this.ui.init();
        this.menu.addActor(this.ui.actor);
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    closeMenu() {
        this.menu.close();
    }
}

function main(metadata, orientation, panel_height, instanceId) {
    try {
        return new StartMenu(metadata, orientation, panel_height, instanceId);        
    } catch (e) {
        console.log(e);
    }
    return 0;
}
