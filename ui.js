const St = imports.gi.St;
const Gtk = imports.gi.Gtk;

function createAppListUI(applet, categories) {
    const apps = _flattenCategories(categories)
    apps.sort((a, b) => a.get_name().localeCompare(b.get_name(), undefined,
                                      {sensitivity: "base", ignorePunctuation: true}));
    const scrollView = new St.ScrollView();
    const applications = new St.BoxLayout({ 
        vertical: true,
    }); 

    apps.forEach(app => applications.add(new AppItemLayout(applet, app).actor))
                
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

function create_sidebar() {
    return new SideBar().actor;
}

class AppItemLayout {

    base_list_style = "padding-left: 9px; padding-top: 9px; padding-bottom: 9px; ";

    constructor(applet, app) {
        this.applet = applet;
        this.app = app;
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
        this.actor.connect('enter-event', () => {
            // Change the background color when the mouse enters
            this.actor.style = this.base_list_style + "background-color: #222222; transition: background-color 0.3s ease-in-out;";
        });

        this.actor.connect('leave-event', () => {
            // Reset the background color when the mouse leaves
            this.actor.style = this.base_list_style + "transition: background-color 0.3s ease-in-out;";
        });
    }

    _onReleaseEvent(actor, event) {
        if (event.get_button() === 1) {
            this.app.open_new_window(-1);
            this.applet.closeMenu();
        }
    }

    _get_icon(app) {
        return app.create_icon_texture(30);
    }
}

class SideBar {

    option_padding = 7;
    icon_size = 30;

    constructor() {
        this.actor = new St.BoxLayout({ 
            vertical: true,
            style: `padding-top: 7px; min-width: ${this.icon_size + this.option_padding}px;`
        });

        console.log(this.actor.style);

        this.addOption(new Power(this));
    }

    addOption(option) { 
        this.actor.add(option.actor, {
            x_fill: false
        });
    }
}

class SidebarOption {

    constructor(sidebar, label, icon_name) {
        this.label_string = label;
        this.base_container_style = `padding: ${sidebar.option_padding}px; `

        this.actor = new St.BoxLayout({
            vertical: false,
            reactive: true,
            style: this.base_container_style
        });

        this.actor.connect('enter-event', () => {
            this.actor.style = this.base_container_style + "background-color: #222222; transition: background-color 0.3s ease-in-out;";
            this.actor.add(this.label, {
                y_fill: false,
                y_align: St.Align.MIDDLE
            });        
        });

        this.actor.connect('leave-event', () => {
            this.actor.style = this.base_container_style + "transition: background-color 0.3s ease-in-out;";
            this.actor.remove_child(this.label);        
        });

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
}

class Power extends SidebarOption {
    constructor(sidebar) {
        super(sidebar, "Power", "system-shutdown-symbolic");
    }
}
