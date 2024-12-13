const Applet = imports.ui.applet;

class StartMenu extends Applet.IconApplet {
    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.set_applet_icon_symbolic_name("start-here");
    }

}

function main(metadata, orientation, panel_height, instance_id) {
    return new StartMenu(orientation, panel_height, instance_id);
}
