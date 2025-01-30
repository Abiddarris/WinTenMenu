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
const {AppletSettings, BindingDirection} = imports.ui.settings;
const Lang = imports.lang;

function loadSettings(applet, metadata, instanceId) {
    applet.preferences = {};
    applet.settings = new AppletSettings(applet.preferences, metadata["uuid"], instanceId);

    applet.settings.bind("menu-width",
                       "menuWidth",
                       () => applet.ui.menuWidthChanged());
    applet.settings.bind("menu-height",
                       "menuHeight",
                       () => applet.ui.menuHeightChanged());

    applet.settings.bindProperty(BindingDirection.IN, "menu-shortcut", "menuShortcut", applet.onShortcutChanged.bind(applet), null);
    applet.settings.bindProperty(BindingDirection.IN, "custom-start-menu-color", "customStartMenuColor", applet.onStartMenuColorChanged.bind(applet), null);
    applet.settings.bindProperty(BindingDirection.IN, "start-menu-color", "startMenuColor", applet.onStartMenuColorChanged.bind(applet), null);    

    applet.onShortcutChanged();
}
