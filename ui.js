/*!
 * Copyright 2024-2025 Abiddarris
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
const AppUI = require('./appui');

class UI {

    constructor(applet) {
        this.applet = applet;
    }

    init() {
        this.menuManager = new PopupMenu.PopupMenuManager(this);

        this.actor = new Clutter.Actor({
            reactive: true
        });
        this.actor.set_layout_manager(new Clutter.BinLayout());
        this.actor.connect('button-release-event', this._onActorClicked.bind(this));

        this.sidebar = new SideBar(this, this.applet);
        this.appUI = new AppUI.AppUI(this, get_categories());

        this.actor.add_actor(this.appUI.actor);
        this.actor.add_actor(this.sidebar.actor);

        this.appUI.actor.set_x(this.sidebar.min_width);
        this.appUI.attachPopupMenu(this.actor);

        this.sidebar.actor.set_x(0);
        this.sidebar.attachPopupMenu(this.actor);

        this.sidebar.actor.set_height(this.getMenuHeight()); 
    }

    _onActorClicked() {
        this.closeMenu();
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

        this.appUI.actor.set_height(height);
    }

    menuWidthChanged() {
        const width = this.getMenuWidth();
 
        this.appUI.actor.set_width(width - this.sidebar.actor.get_width());
    }

    showMenu(menu) {
        if (menu.isOpen) {
            return;
        }

        if (this.isMenuOpen()) {
            this.closeMenu();
        }

        this._menu = menu;
        this._menu.open(true);
    }

    closeMenu() {
        if (this._menu == undefined) {
            return;
        }

        const menu = this._menu;

        this._menu = undefined;

        menu.close();
    }

    isMenuOpen() {
        return this._menu != undefined;
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
    _ignoreEnterEventUntilLeaveEventFired = false;

    constructor(ui, applet) {
        this.applet = applet;
        this.ui = ui;

        this.actor = new St.Widget({
            reactive: true,
            style : this.base_style
        });
        this.actor.set_height(ui.getMenuHeight());
        this.actor.set_layout_manager(new Clutter.BinLayout());

        this.actor.connect('enter-event', this._enterEvent.bind(this));
        this.actor.connect('leave-event', this._onLeaveEvent.bind(this));
        this.actor.connect('button-release-event', this._onReleaseEvent.bind(this));

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
            this.bottomOptions[i].actor.set_y(height - sidebarOptionHeight * (i + 1) - 10);
        }
    }

    toggle() {
        if (this.inHoverState) {
            this.inHoverState = false;
            this.hideLabels();
            return;
        }

        this.inHoverState = true;
        this.showLabels();
    }

    ignoreEnterEventUntilLeaveEventFired() {
        this._ignoreEnterEventUntilLeaveEventFired = true;
    }

    _enterEvent(actor, event) {
        if (this.actor.contains(event.get_related())) {
            return;
        }

        if (this.ui.isMenuOpen() || this._ignoreEnterEventUntilLeaveEventFired) {
            return Clutter.EVENT_PROPAGATE;
        }
        this.inHoverState = true;

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, Lang.bind(this, this.showLabels));
    }

    _onReleaseEvent() {
         if (this.ui.isMenuOpen()) {
            this.ui.closeMenu();
            this._enterEvent();

            return Clutter.EVENT_STOP;
        }

    }

    _onLeaveEvent(actor, event) {
        if (event != undefined && this.actor.contains(event.get_related())) {
            return;
        }

        if (this.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

        this.inHoverState = false;
        this._ignoreEnterEventUntilLeaveEventFired = false;

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

        this.actor.connect('button-release-event', this._on_release_event.bind(this));
        this.actor.connect('enter-event', this._enterEvent.bind(this));
        this.actor.connect('leave-event', this._leaveEvent.bind(this));

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

    _on_release_event() {
        if (this.sidebar.ui.isMenuOpen()) {
            this.sidebar.ui.closeMenu();
            this._enterEvent();

            return Clutter.EVENT_STOP;
        }

        return this.on_release_event();
    }

    _enterEvent() {
        if (this.sidebar.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

        this.actor.style = this.base_container_style + "background-color: #222222; transition: background-color 0.3s ease-in-out;";
    }

    _leaveEvent(actor, event) {
        if (this.sidebar.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

        this.actor.style = this.base_container_style + "transition: background-color 0.3s ease-in-out;";
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
        this._leaveEvent();
    }

    on_release_event() {
        if (this._popup_menu.isOpen) {
            this.sidebar.ui.closeMenu();

            return Clutter.EVENT_STOP;
        }
        const monitor = Main.layoutManager.findMonitorForActor(this._popup_menu.actor);
        let [mx, my] = this.actor.get_transformed_position();
        my -= this._popup_menu.actor.height;

        this._popup_menu.actor.width = Math.max(this._popup_menu.actor.width, this.sidebar.getSidebarExpandedWidth());
        
        if (mx > monitor.x + monitor.width - this._popup_menu.actor.width) {
            mx -= this._popup_menu.actor.width;
        }
        if (my > monitor.y + monitor.height - this._popup_menu.actor.height - 40/*allow for panel*/) {
            my -= this._popup_menu.actor.height;
        }

        let [cx, cy] = this.popupMenuBox.get_transformed_position();
        
        this.sidebar.ui.closeMenu();
        this.sidebar.lockSidebar();

        this._popup_menu.actor.set_anchor_point(Math.round(cx - mx), Math.round(cy - my));

        this.sidebar.ui.showMenu(this._popup_menu);

        return Clutter.EVENT_STOP;
    }

}

class Start extends SidebarOption {
    constructor(sidebar) {
        super(sidebar, "START", "application-menu");
    }

    on_release_event() {
        this.sidebar.ignoreEnterEventUntilLeaveEventFired();
        this.sidebar.toggle();
    }
}

class Account extends PopupSidebarOption {

    constructor(sidebar) {
        super(sidebar, GLib.get_user_name(), "avatar-default");
    }

    populatePopupMenu(menu) {
        this._addMenuItem("Change account settings", "system-users", () => {
            GLib.spawn_command_line_async("cinnamon-settings user")
            this.sidebar.applet.closeMenu();
        });
                
        this._addMenuItem("Lock", "changes-prevent", () => {
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

        return Clutter.EVENT_STOP;
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
        super(sidebar, "Settings", "preferences-system");
    }

    on_release_event() {
        GLib.spawn_command_line_async("cinnamon-settings");
        this.sidebar.applet.closeMenu();

        return Clutter.EVENT_STOP;
    }
}

class Power extends PopupSidebarOption {

    constructor(sidebar) {
        super(sidebar, "Power", "system-shutdown");
    }

    populatePopupMenu(menu) {
        this._addMenuItem("Sleep", "system-suspend", () => {
            GLib.spawn_command_line_async("systemctl suspend");
        });

        this._addMenuItem("Shutdown", "system-shutdown", () => {
            GLib.spawn_command_line_async("shutdown now");
        });

        this._addMenuItem("Restart", "system-reboot", () => {
            GLib.spawn_command_line_async("reboot");
        });
 
    }
}
