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
