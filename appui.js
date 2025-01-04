const St = imports.gi.St;

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

    apps.forEach(app => applications.add(new AppItemLayout(ui, applet, app).actor))

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

    constructor(ui, applet, app) {
        this.applet = applet;
        this.app = app;
        this.ui = ui;

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

        if (event.get_button() === 1) {
            this.app.open_new_window(-1);
            this.applet.closeMenu();
        }

        return Clutter.EVENT_STOP;
    }

    _get_icon(app) {
        return app.create_icon_texture(30);
    }
}

