const St = imports.gi.St;

function createAppListUI(categories) {
    const scrollView = new St.ScrollView();
    const applications = new St.BoxLayout({ vertical: true }); 

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
        this.actor = new St.BoxLayout();
        this.label = new St.Label();

        const clutterText = this.label.get_clutter_text();
        clutterText.set_markup(app.get_name());

        this.actor.add(this.label);
    }
}
