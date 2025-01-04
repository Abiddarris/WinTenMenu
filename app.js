/*!
 *   Copyright 2024-2025 Abiddarris
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
const {AppSystem} = imports.gi.Cinnamon;
const {TreeItemType} = imports.gi.CMenu;

class Category {
    constructor(category, apps) {
        this.category = category;
        this.apps = apps;
    }
}

const _appSystem = AppSystem.get_default();

function get_categories() {
    const iter = _appSystem.get_tree().get_root_directory().iter();
    let categories = [];
    let nextType;

    while ((nextType = iter.next()) !== TreeItemType.INVALID) {
        if (nextType !== TreeItemType.DIRECTORY) {
            continue;
        }

        const dir = iter.get_directory();

        if (dir.get_is_nodisplay()) {
            continue;
        }

        const dirId = dir.get_menu_id();
        const apps = _get_application_from_dir(dir);
 
        if (apps.length <= 0) {
            continue;
        }

        categories.push(new Category(dir, apps));
    }

    return categories;
}

function _get_application_from_dir(dir) {
    const iter = dir.iter();
    let apps = [];
    let nextType;

    while ((nextType = iter.next()) !== TreeItemType.INVALID) {
        if (nextType === TreeItemType.ENTRY) {
            const app = _appSystem.lookup_app(iter.get_entry().get_desktop_file_id());
            if  (!app || app.get_nodisplay()) {
                continue;
            }

            apps.push(app);
        } else if (nextType === TreeItemType.DIRECTORY) {
            const child_dir = iter.get_directory();
            if (!child_dir.get_is_nodisplay()) {
                apps = apps.concat(_get_application_from_dir(child_dir));
            }
        }
    }
    return apps;
}
