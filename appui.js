const St = imports.gi.St;
const Clutter = imports.gi.Clutter;

class AppUI {
    constructor(ui, categories) {
        this.actor = new St.ScrollView({
            width: ui.getMenuWidth(),
            height: ui.getMenuHeight(),
            style: "padding-top: 7px;"
        });

        const applications = new St.BoxLayout({ 
            vertical: true
        }); 

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
                applications.add(new CategoryUI(ui, key).actor);
                
                apps.forEach(app => applications.add(new ApplicationUI(ui, app).actor));
            });

        this.actor.add_actor(applications);
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
        this.actor.connect('leave-event', () => {
            if (ui.isMenuOpen()) {
                return Clutter.EVENT_PROPAGATE;
            }

            // Reset the background color when the mouse leaves
            this.actor.style = this.base_list_style + "transition: background-color 0.3s ease-in-out;";
        });
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

        this.onReleaseEvent(actor, event);
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
        clutterText.set_markup(app.get_name());

        this.actor.add(this._get_icon(app));
        this.actor.add(this.label, {
            y_fill: false,
            y_align: St.Align.MIDDLE
        });
    }

    onReleaseEvent(actor, event) {
        if (event.get_button() === 1) {
            this.app.open_new_window(-1);
            this.ui.applet.closeMenu();
        }

        return Clutter.EVENT_STOP;
    }
    
    _get_icon(app) {
        return app.create_icon_texture(30);
    }
}

