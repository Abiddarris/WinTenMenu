/*!
 * Copyright 2025 Abiddarris
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
const Clutter = imports.gi.Clutter;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const {getUserDesktopDir, changeModeGFile} = imports.misc.fileUtils;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const {spawnCommandLine} = imports.misc.util;

class AppUI {
    constructor(ui, categories) {
        this.ui = ui;
        this.actor = new St.ScrollView({
            width: ui.getMenuWidth(),
            height: ui.getMenuHeight(),
            style: "padding-top: 7px;"
        });
        
        this.applications = new St.BoxLayout({ 
            vertical: true
        }); 

        this.popupMenu = new PopupMenu.PopupMenu(this.ui.actor);
        this.popupMenu.actor.hide();
        this.popupMenu.connect('open-state-changed', this._popupMenuStateChanged.bind(this));

        const addMenuItem = (label, iconName, action) => {
            let menuItem = new PopupMenu.PopupIconMenuItem(label, iconName, St.IconType.SYMBOLIC, {focusOnHover: false});
            menuItem.connect("activate", action);

            this.popupMenu.addMenuItem(menuItem);
        }

        if (getUserDesktopDir()) {
            addMenuItem("Add to desktop", "computer", this._addToDesktop.bind(this));
        }
        addMenuItem("Pin to taskbar", "view-pin", this._pinToTaskbar.bind(this));

        if (GLib.file_test("/usr/bin/cinnamon-remove-application", GLib.FileTest.EXISTS)) {
            addMenuItem("Uninstall", "edit-delete", this._uninstall.bind(this));
        }

        this.popupMenuBox = new St.BoxLayout({ style_class: '', vertical: true, reactive: true });
        this.popupMenuBox.add_actor(this.popupMenu.actor);
        this.popupMenuBox.height = 0;
        this.popupMenuBox.width = 0;

        let apps = _flattenCategories(categories)
        apps.sort((a, b) => a.get_name().localeCompare(b.get_name(), undefined,
                                          {sensitivity: "base", ignorePunctuation: true}));
        apps = apps.reduce((acc, app) => {
            const name = app.get_name();

            let key = name.charAt(0).toUpperCase();
            if (!isNaN(key)) {
                key = "#"
            } else if (key.match(/[^A-Z]/i)) {
                key = "&"
            }

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(app)

            return acc;
        }, {});

        Object.entries(apps)
            .sort(([key], [key2]) => {
                if (key == "&" && key2 == "#") {
                    return 0;
                }

                if (key == "#" && key2 == "&") {
                    return 1;
                }

                return key.localeCompare(key2);
            })
            .forEach(([key, apps]) => {
                this.applications.add(new CategoryUI(ui, key).actor);
                
                apps.forEach(app => this.applications.add(new ApplicationUI(ui, app).actor));
            });

        this.actor.add_actor(this.applications);
    }

    attachPopupMenu(box) {
        box.add_actor(this.popupMenuBox, {expand: false, x_fill: false,
                                                    x_align: St.Align.START, y_align: St.Align.MIDDLE,});
    }

    _addToDesktop() {
        const file = Gio.file_new_for_path(this.item.app.get_app_info().get_filename());
        const destFile = Gio.file_new_for_path(getUserDesktopDir() + '/' + file.get_basename());

        try {
            file.copy(destFile, 0, null, null);
            changeModeGFile(destFile, 755);
        } catch(e) {
            global.logError('Error while adding app to desktop', e);
        }
    }

    _pinToTaskbar() {
        if (!Main.AppletManager.get_role_provider_exists(Main.AppletManager.Roles.PANEL_LAUNCHER)) {
            const new_applet_id = global.settings.get_int('next-applet-id');

            global.settings.set_int('next-applet-id', (new_applet_id + 1));
            const enabled_applets = global.settings.get_strv('enabled-applets');

            enabled_applets.push('panel1:right:0:panel-launchers@cinnamon.org:' + new_applet_id);
            global.settings.set_strv('enabled-applets', enabled_applets);
        }

        const launcherApplet = Main.AppletManager.get_role_provider(Main.AppletManager.Roles.PANEL_LAUNCHER);
        if (launcherApplet) {
            launcherApplet.acceptNewLauncher(this.item.app.id);
        }
    }

    _uninstall() {
        spawnCommandLine("/usr/bin/cinnamon-remove-application '" + this.item.app.get_app_info().get_filename() + "'");
        this.ui.closeMenu();
    }

    showMenu(item, mx, my) {
        this.item = item;

        const monitor = Main.layoutManager.findMonitorForActor(this.popupMenu.actor);
       
        if (mx > monitor.x + monitor.width - this.popupMenu.actor.width) {
            mx -= this.popupMenu.actor.width;
        }
        if (my > monitor.y + monitor.height - this.popupMenu.actor.height - 40/*allow for panel*/) {
            my -= this.popupMenu.actor.height;
        }

        let [cx, cy] = this.popupMenuBox.get_transformed_position();
       
        this.popupMenu.actor.set_anchor_point(Math.round(cx - mx), Math.round(cy - my));

        this.ui.showMenu(this.popupMenu);
    }

    _popupMenuStateChanged(menu, open) {
        if (open) { 
            return;
        }
        
        this.item._onLeaveEvent();
        this.item = null;
    }
}

function _flattenCategories(categories) {
    let apps = [];
    categories.forEach(category => {
        category.apps.forEach(app => apps.push(app));
    });

    return apps;
}

class AppUIItem {
    base_list_style = "padding-left: 9px; padding-top: 9px; padding-bottom: 9px; ";

    constructor(ui) {
        this.ui = ui;

        this.actor = new St.BoxLayout({
             reactive: true, 
             style: this.base_list_style
        });
 
        this.actor.connect('button-release-event', this._onReleaseEvent.bind(this));
        this.actor.connect('enter-event', this._enterEvent.bind(this));
        this.actor.connect('leave-event', this._onLeaveEvent.bind(this));
    }

    _enterEvent() {
        if (this.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

       this.actor.style = this.base_list_style + "background-color: #222222; transition: background-color 0.3s ease-in-out;";
    }

    _onReleaseEvent(actor, event) {
        if (this.ui.isMenuOpen()) {
            this.ui.closeMenu();
            this._enterEvent();

            return Clutter.EVENT_STOP;
        }

        return this.onReleaseEvent(actor, event);
    }

    _onLeaveEvent() {
        if (this.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

        // Reset the background color when the mouse leaves
        this.actor.style = this.base_list_style + "transition: background-color 0.3s ease-in-out;";
    }

    onReleaseEvent(actor, event) {
    }
  
}

class CategoryUI extends AppUIItem {
    constructor(ui, name) {
        super(ui);

        this.label = new St.Label({
            style: "padding-left: 7px"
        });

        const clutterText = this.label.get_clutter_text();
        clutterText.set_text(name);

        this.actor.add(this.label, {
            y_fill: false,
            y_align: St.Align.MIDDLE
        });
    }
}

class ApplicationUI extends AppUIItem {

    constructor(ui, app) {
        super(ui);

        this.app = app;

        this.label = new St.Label({
            style: "padding-left: 7px"
        });

        const clutterText = this.label.get_clutter_text();
        clutterText.set_text(app.get_name());

        this.actor.add(this._get_icon(app));
        this.actor.add(this.label, {
            y_fill: false,
            y_align: St.Align.MIDDLE
        });
    }

    onReleaseEvent(actor, event) {
        if (this.ui.appUI.popupMenu.isOpen) {
            this.sidebar.ui.closeMenu();

            return Clutter.EVENT_STOP;
        }

        if (event.get_button() === Clutter.BUTTON_PRIMARY) {
            this.app.open_new_window(-1);
            this.ui.applet.closeMenu();
        } else if (event.get_button() === Clutter.BUTTON_SECONDARY) {
            let x, y;
            [x, y] = event.get_coords();
            this.ui.appUI.showMenu(this, x, y);
        }

        return Clutter.EVENT_STOP;
    }
    
    _get_icon(app) {
        return app.create_icon_texture(30);
    }
}

