const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

class StartMenu extends Applet.IconApplet {
    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.orientation = orientation;
        
        this.set_applet_icon_symbolic_name("start-here");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, this.orientation);
        this.menuManager.addMenu(this.menu)       

        this._box = new St.BoxLayout({
            vertical: true,
            width: 300,
            height: 700
        });

        this.menu.addActor(this._box);
    }

    on_applet_clicked() {
        this.menu.toggle();
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    try {
        return new StartMenu(orientation, panel_height, instance_id);        
    } catch (e) {
        console.log(e);
    }
    return 0;
}