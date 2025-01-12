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
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
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
        this.menu.connect('open-state-changed', this.onMenuClose.bind(this));

        this.menuManager.addMenu(this.menu);  

        this.ui = new Ui.UI(this);  
        
        Settings.loadSettings(this, metadata, instanceId);

        this.ui.init();
        this.menu.addActor(this.ui.actor);
    }

    onShortcutChanged() {
        console.log(this.preferences);
        Main.keybindingManager.addHotKey("menu-shortcut-" + this.instance_id, this.preferences.menuShortcut, () => {                              
            if (Main.overview.visible || Main.expo.visible) return;

            this.on_applet_clicked();
        });
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    closeMenu() {
        this.menu.close();
    }

    onMenuClose(menu, open) {
        if (!open) {
            this.ui.closeMenu();
        }
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
