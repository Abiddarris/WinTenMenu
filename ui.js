const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const {get_categories} = require('./app');
const Display = require('./display');

class UI {
    _menus = [];

    constructor(applet) {
        this.applet = applet;
    }

    init() {
        this.menuManager = new PopupMenu.PopupMenuManager(this);

        this.actor = new Clutter.Actor();
        this.actor.set_layout_manager(new Clutter.BinLayout());

        this.sidebar = new SideBar(this, this.applet);
        this.appList = createAppListUI(this, this.applet, get_categories());

        this.actor.add_actor(this.appList);
        this.actor.add_actor(this.sidebar.actor);

        this.appList.set_x(this.sidebar.min_width);

        this.sidebar.actor.set_x(0);
        this.sidebar.attachPopupMenu(this.actor);

        this.sidebar.actor.set_height(this.getMenuHeight()); 
    }

    getMenuHeight() {
        return this.applet.preferences["menuHeight"] * Display.getDisplaySize()[1] / 100;
    }

    getMenuWidth() {
        return this.applet.preferences["menuWidth"] * Display.getDisplaySize()[0] / 100;
    }

    menuHeightChanged() {
        const height = this.getMenuHeight();

        this.sidebar.actor.set_height(height); 
        this.sidebar.onHeightChanged(height);
        this.appList.set_height(height);
    }

    menuWidthChanged() {
        const width = this.getMenuWidth();
 
        this.appList.set_width(width - this.sidebar.actor.get_width());
    }

    registerMenu(menu) {
        this._menus.push(menu);
    }

    closeMenus() {
        this._menus.forEach((menu) => {
            if (menu.isOpen) {
                menu.close();
            }
        });
    }
}

function createAppListUI(ui, applet, categories) {
    const apps = _flattenCategories(categories)
    apps.sort((a, b) => a.get_name().localeCompare(b.get_name(), undefined,
                                      {sensitivity: "base", ignorePunctuation: true}));
    const scrollView = new St.ScrollView({
        width: ui.getMenuWidth(),
        height: ui.getMenuHeight(),
        style: "padding-top: 7px;"
    });
    const applications = new St.BoxLayout({ 
        vertical: true
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
    bottomOptions = [];
    inHoverState = false;

    constructor(ui, applet) {
        this.applet = applet;
        this.ui = ui;

        this.actor = new St.Widget({
            reactive: true,
            style : this.base_style
        });
        this.actor.set_height(ui.getMenuHeight());
        this.actor.set_layout_manager(new Clutter.BinLayout());

        this.actor.connect('enter-event', () => {
            this.inHoverState = true;

            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, Lang.bind(this, this.showLabels));
        });

        this.actor.connect('leave-event', this._onLeaveEvent.bind(this));

        console.log(this.actor.style);

        this.addOption(new Start(this));

        this.addBottomOption(new Power(this));
        this.addBottomOption(new Settings(this));
        this.addBottomOption(new Pictures(this));
        this.addBottomOption(new Documents(this));
        this.addBottomOption(new Account(this));
        this.onHeightChanged(ui.getMenuHeight());
    }

    getSidebarExpandedWidth() {
        return 17 * Display.getDisplaySize()[0] / 100;
    }


    getSidebarOptionHeight() {
        return this.option_padding * 2 + this.icon_size;
    }

    showLabels() {
        if (!this.inHoverState || this._locked) {
            return;
        }
        
        this.actor.set_width(this.getSidebarExpandedWidth());
        this.actor.style = this.base_style + "background-color: #000000; transition: background-color 0.3s ease-in-out;" 

        this.options.forEach((option) => {
            option.showLabel();
        });
    }

    hideLabels() {
        if (this.inHoverState || this._locked) {
            return;
        }

        this.actor.set_width(-1);
        this.actor.style = this.base_style;

        this.options.forEach((option) => {
                option.hideLabel();
        });
    }

    lockSidebar() {
        this._locked = true;
    }

    unlockSidebar() {
        if (!this._locked) {
            return;
        }

        this._locked = false;
        this._onLeaveEvent();
    }

    addOption(option) { 
        this.actor.add_child(option.actor);
        this.options.push(option);

        option.actor.set_y(7);
    }

    addBottomOption(option) {
        this.addOption(option);
        this.bottomOptions.push(option);
    }

    attachPopupMenu(box) {
        this.options.forEach(option => option.attachPopupMenu(box));
    }

    onHeightChanged(height) {
        const sidebarOptionHeight = this.getSidebarOptionHeight();
        
        for (let i = 0; i < this.bottomOptions.length; i++) {
            this.bottomOptions[i].actor.set_y(height - sidebarOptionHeight * (i + 1));
        }
    }

    _onLeaveEvent() {
        this.inHoverState = false;

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, Lang.bind(this, this.hideLabels));
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
        this.actor.set_width(this.sidebar.getSidebarExpandedWidth());
        this.actor.add(this.label, {
                y_fill: false,
                y_align: St.Align.MIDDLE
        });       
    }

    hideLabel() {
        this.actor.set_width(-1);
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
        this._popup_menu.connect('open-state-changed', this._popupMenuStateChanged.bind(this));

        this.sidebar.ui.registerMenu(this._popup_menu);

        this.populatePopupMenu(this._popup_menu);
        
        this.popupMenuBox = new St.BoxLayout({ style_class: '', vertical: true, reactive: true });
        this.popupMenuBox.add_actor(this._popup_menu.actor);
        this.popupMenuBox.height = 0;
        this.popupMenuBox.width = 0;

        box.add_actor(this.popupMenuBox, {expand: false, x_fill: false,
                                                    x_align: St.Align.START, y_align: St.Align.MIDDLE,});
    }

    _addMenuItem(label, iconName, action) {
        let menuItem = new PopupMenu.PopupIconMenuItem(label, iconName, St.IconType.SYMBOLIC, {focusOnHover: false});
        menuItem.connect("activate", action);

        this._popup_menu.addMenuItem(menuItem);
    }

    _popupMenuStateChanged(menu, open) {
        if (open) { 
            return;
        }

        this.sidebar.unlockSidebar();
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
        
        this.sidebar.ui.closeMenus();
        this.sidebar.lockSidebar();

        this._popup_menu.actor.set_anchor_point(Math.round(cx - mx), Math.round(cy - my));
        this._popup_menu.toggle();
    }

}

class Start extends SidebarOption {
    constructor(sidebar) {
        super(sidebar, "START", "application-menu");
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
