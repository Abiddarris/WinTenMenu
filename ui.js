const St = imports.gi.St;

function createAppListUI(categories) {
    const scrollView = new St.ScrollView();
    const applications = new St.BoxLayout({ 
        vertical: true,
        style: "spacing: 12px;"
    }); 

    categories.forEach(category => {
        category.apps.forEach(app => {
            applications.add(new AppItemLayout(app).actor);
        });
    });


    scrollView.add_actor(applications);

    return scrollView;
}

class AppItemLayout {

    constructor(app) {
        this.app = app;
        this.actor = new St.BoxLayout({ reactive: true });
        this.label = new St.Label({
            style: "padding-left: 7px"
        });

        const clutterText = this.label.get_clutter_text();
        clutterText.set_markup(app.get_name());

        this.actor.add(this._get_icon(app));
        this.actor.add(this.label);

        this.actor.connect('button-release-event', this._onReleaseEvent.bind(this));
    }

    _onReleaseEvent(actor, event) {
        if (event.get_button() === 1) {
            this.app.open_new_window(-1);
        }
    }

    _get_icon(app) {
        return app.create_icon_texture(30);
    }
}
