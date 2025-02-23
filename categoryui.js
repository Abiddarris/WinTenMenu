const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Color = require('./color');

class CategoryUI {
    constructor(ui) {
        this.ui = ui;
        this.categories = [];

        this.actor = new Clutter.Actor({
            layout_manager: new Clutter.GridLayout()
        });
        this.actor.hide();
    
        const categories = [
            "&", "#", "A", "B", 
            "C", "D", "E", "F", 
            "G", "H", "I", "J", 
            "K", "L", "M", "N", 
            "O", "P", "Q", "R", 
            "S", "T", "U", "V", 
            "W", "X", "Y", "Z"
        ];

        let columns = 0;
        let row = 0;
        categories.forEach(category => {
            const item = new ItemLayout(this, category);
            if (columns === 4) {
                row++;
                columns = 0;
            }

            this.categories.push(item);
            this.actor.layout_manager.attach(item.actor, columns, row, 1, 1);

            columns++;
        });
    }

    onStartMenuColorChanged() {
        this.categories.forEach((category) => category.onStartMenuColorChanged());
    }

    onResize() {
        this.actor.set_x((this.ui.getMenuWidth() - this.ui.sidebar.min_width) / 2 - this.actor.get_width() / 2 + this.ui.sidebar.min_width);
        this.actor.set_y(this.ui.getMenuHeight() / 2 - this.actor.get_height() / 2);
    }
}

class ItemLayout {
    constructor(categoryUI, categoryName) {
        this.ui = categoryUI.ui;
        this.categoryName = categoryName;
        this.base_style = "padding: 15px; ";

        this.actor = new St.BoxLayout({style: "padding: 5px"});

        this.box = new St.BoxLayout({style: this.base_style, reactive: true});
        this.box.connect('button-release-event', this._onReleaseEvent.bind(this));
        this.box.connect('enter-event', this._enterEvent.bind(this));
        this.box.connect('leave-event', this._onLeaveEvent.bind(this));
       
        this.label = new St.Label({style : this._getLabelStyle()});
        
        const clutterText = this.label.get_clutter_text();
        clutterText.set_text(categoryName);

        this.actor.add_actor(this.box);
        this.box.add_actor(this.label);
    }

    _getLabelStyle() {
        return `color: ${this._isEnabled() ? Color.getTextColor(this.ui.applet).toCSSColor() : "#A0A0A0"};`;
    }

    onStartMenuColorChanged() {
        this.label.style = this._getLabelStyle();
    }

    _isEnabled() {
        return this.ui.appUI.categoryUIs.has(this.categoryName);
    }

    _enterEvent() {
        if (!this._isEnabled()) {
            return;
        }
        if (this.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

       this.box.style = this.base_style + `background-color: ${Color.getHoveredColor(this.ui.applet).toCSSColor()}; transition: background-color 0.3s ease-in-out;`;
    }

    _onReleaseEvent(actor, event) {
        if (!this._isEnabled()) {
            return;
        }
        if (this.ui.isMenuOpen()) {
            this.ui.closeMenu();
            this._enterEvent();

            return Clutter.EVENT_STOP;
        }

        this.ui.appUI.actor.vscroll.adjustment.set_value(this.ui.appUI.categoryUIs.get(this.categoryName).actor.get_position()[1]);

        this.ui.categoryUI.actor.hide();
        this.ui.appUI.actor.show();  
    }

    _onLeaveEvent() {
        if (!this._isEnabled()) {
            return;
        }
        if (this.ui.isMenuOpen()) {
            return Clutter.EVENT_PROPAGATE;
        }

        this.box.style = this.base_style + "transition: background-color 0.3s ease-in-out;";
    }
}
