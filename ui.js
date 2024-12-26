const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const {get_categories} = require('./app');

function createUI(applet) {
    let box = new Clutter.Actor();
    box.set_layout_manager(new Clutter.BinLayout());

    const sidebar = new SideBar(applet);
    const appList = createAppListUI(applet, get_categories());

    box.add_actor(appList);
    box.add_actor(sidebar.actor);

    appList.set_x(sidebar.min_width);

    sidebar.actor.set_x(0);
    sidebar.attachPopupMenu(box);

    sidebar.actor.set_height(700); 

    return box;
}

function createAppListUI(applet, categories) {
    const apps = _flattenCategories(categories)
    apps.sort((a, b) => a.get_name().localeCompare(b.get_name(), undefined,
                                      {sensitivity: "base", ignorePunctuation: true}));
    const scrollView = new St.ScrollView({
        style: "position: absolute; top: 80px; left: 20;"
    });
    const applications = new St.BoxLayout({ 
        vertical: true,
    }); 

    apps.forEach(app => applications.add(new AppItemLayout(applet, app).actor))

    scrollView.add_actor(applications);

    return scrollView;
}

function _flattenCategories(categories) {
    let apps = [];
    categories.forEach(category => {
        category.apps.forEach(app => apps.push(app));
    });

    return apps;
}

class AppItemLayout {

    base_list_style = "padding-left: 9px; padding-top: 9px; padding-bottom: 9px; ";

    constructor(applet, app) {
        this.applet = applet;
        this.app = app;
        this.actor = new St.BoxLayout({
             reactive: true, 
             style: this.base_list_style
        });
        this.label = new St.Label({
            style: "padding-left: 7px"
        });

        const clutterText = this.label.get_clutter_text();
        clutterText.set_markup(app.get_name());

        this.actor.add(this._get_icon(app));
        this.actor.add(this.label, {
            y_fill: false,
            y_align: St.Align.MIDDLE
        });

        this.actor.connect('button-release-event', this._onReleaseEvent.bind(this));
        this.actor.connect('enter-event', () => {
            // Change the background color when the mouse enters
            this.actor.style = this.base_list_style + "background-color: #222222; transition: background-color 0.3s ease-in-out;";
        });

        this.actor.connect('leave-event', () => {
            // Reset the background color when the mouse leaves
            this.actor.style = this.base_list_style + "transition: background-color 0.3s ease-in-out;";
        });
    }

    _onReleaseEvent(actor, event) {
        if (event.get_button() === 1) {
            this.app.open_new_window(-1);
            this.applet.closeMenu();
        }
    }

    _get_icon(app) {
        return app.create_icon_texture(30);
    }
}

class SideBar {

    option_padding = 7;
    icon_size = 30;
    min_width = this.icon_size + (this.option_padding * 2);
    base_style = `padding-top: 7px; min-width: ${this.min_width}px; `; //`
    options = [];

    constructor(applet) {
        this.applet = applet;
        this.actor = new St.BoxLayout({ 
            vertical: true,
            style: this.base_style,
            reactive: true            
        });
        this.actor.connect('enter-event', () => {
            this.actor.style = this.base_style + "background-color: #000000; transition: background-color 0.3s ease-in-out;"   
            this.options.forEach((option) => {
                option.showLabel();
            });
        });

        this.actor.connect('leave-event', () => {
            this.actor.style = this.base_style;
            this.options.forEach((option) => {
                option.hideLabel();
            });
        });

        console.log(this.actor.style);

        this.addOption(new Account(this));
        this.addOption(new Documents(this));
        this.addOption(new Pictures(this));
        this.addOption(new Settings(this));
        this.addOption(new Power(this));
    }

    addOption(option) { 
        this.actor.add(option.actor, {
            x_fill: false
        });
        this.options.push(option);
    }

    attachPopupMenu(box) {
        this.options.forEach(option => option.attachPopupMenu(box));
    }
}

class SidebarOption {

    constructor(sidebar, label, icon_name) {
        this.sidebar = sidebar;
        this.label_string = label;
        this.base_container_style = `padding: ${sidebar.option_padding}px; `

        this.actor = new St.BoxLayout({
            vertical: false,
            reactive: true,
            style: this.base_container_style
        });

        this.actor.connect('button-release-event', this.on_release_event.bind(this));
        this.actor.connect('enter-event', () => {
            this.actor.style = this.base_container_style + "background-color: #222222; transition: background-color 0.3s ease-in-out;";
        });

        this.actor.connect('leave-event', () => {
            this.actor.style = this.base_container_style + "transition: background-color 0.3s ease-in-out;";
        });

        this.icon = new St.Icon({
            icon_name: icon_name,
            icon_size: sidebar.icon_size
        });

        this.label = new St.Label({
            style: "padding-left: 7px"
        });

        const clutterText = this.label.get_clutter_text();
        clutterText.set_markup(this.label_string);

        this.actor.add(this.icon);
    }

    attachPopupMenu(box) {
    }

    on_release_event() {
    }

    showLabel() {
        this.actor.add(this.label, {
                y_fill: false,
                y_align: St.Align.MIDDLE
        });       
    }

    hideLabel() {
        this.actor.remove_child(this.label);    
    }
}

class PopupSidebarOption extends SidebarOption {

    constructor(sidebar, name, icon, path) {
        super(sidebar, name, icon);
    }

    attachPopupMenu(box) {
        this._popup_menu = new PopupMenu.PopupMenu(this.actor);        
        this._popup_menu.actor.hide();

        this.populatePopupMenu(this._popup_menu);
        
        this.popupMenuBox = new St.BoxLayout({ style_class: '', vertical: true, reactive: true });
        this.popupMenuBox.add_actor(this._popup_menu.actor);
        this.popupMenuBox.height = 0;
        this.popupMenuBox.width = 0;

        box.add_actor(this.popupMenuBox, {expand: false, x_fill: false,
                                                    x_align: St.Align.START, y_align: St.Align.MIDDLE,});
    }

    _addMenuItem(label, iconName, action) {
        let menuItem = new PopupMenu.PopupIconMenuItem(label, iconName, St.IconType.SYMBOLIC);
        menuItem.connect("activate", action);

        this._popup_menu.addMenuItem(menuItem);
    }

    on_release_event() {
        if (this._popup_menu.isOpen) {
            this._popup_menu.toggle();
            return;
        }
        const monitor = Main.layoutManager.findMonitorForActor(this._popup_menu.actor);
        let [mx, my] = this.actor.get_transformed_position();
        my += 20;
        
        if (mx > monitor.x + monitor.width - this._popup_menu.actor.width) {
            mx -= this._popup_menu.actor.width;
        }
        if (my > monitor.y + monitor.height - this._popup_menu.actor.height - 40/*allow for panel*/) {
            my -= this._popup_menu.actor.height;
        }

        let [cx, cy] = this.popupMenuBox.get_transformed_position();
        
        this._popup_menu.actor.set_anchor_point(Math.round(cx - mx), Math.round(cy - my));
        this._popup_menu.toggle();
    }

}

class Account extends PopupSidebarOption {

    constructor(sidebar) {
        super(sidebar, GLib.get_user_name(), "user_icon");
    }

    populatePopupMenu(menu) {
        this._addMenuItem("Change account settings", "user-identity", () => {
            GLib.spawn_command_line_async("cinnamon-settings user")
            this.sidebar.applet.closeMenu();
        });
                
        this._addMenuItem("Lock", "lock", () => {
            GLib.spawn_command_line_async("cinnamon-screensaver-command --lock");
            this.sidebar.applet.closeMenu();
        });

        this._addMenuItem("Sign out", "system-log-out", () => {
            GLib.spawn_command_line_async("cinnamon-session-quit --logout --no-prompt");
        });
    }
}

class Folder extends SidebarOption {

    constructor(sidebar, name, icon, path) {
        super(sidebar, name, icon);

        this.path = path;
    }

    on_release_event() {
        const file = GLib.get_home_dir() + "/" + this.path;
        GLib.spawn_command_line_async('xdg-open ' + file);

        this.sidebar.applet.closeMenu();
    }
}

class Pictures extends Folder {
    
    constructor(sidebar) {
        super(sidebar, "Pictures", "folder-pictures", "Pictures");
    }
    
}

class Documents extends Folder {
    
    constructor(sidebar) {
        super(sidebar, "Documents", "folder-documents", "Documents");
    }
    
}


class Settings extends SidebarOption {

    constructor(sidebar) {
        super(sidebar, "Settings", "system-settings");
    }

    on_release_event() {
        GLib.spawn_command_line_async("cinnamon-settings");
        this.sidebar.applet.closeMenu();
    }
}

class Power extends PopupSidebarOption {

    constructor(sidebar) {
        super(sidebar, "Power", "system-shutdown-symbolic");
    }

    populatePopupMenu(menu) {
        this._addMenuItem("Sleep", "sleep-symbolic", () => {
            GLib.spawn_command_line_async("systemctl suspend");
        });

        this._addMenuItem("Shutdown", "system-shutdown-symbolic", () => {
            GLib.spawn_command_line_async("shutdown now");
        });

        this._addMenuItem("Restart", "system-restart-symbolic", () => {
            GLib.spawn_command_line_async("reboot");
        });
 
    }
}
