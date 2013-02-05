/*! Sticker - v0.3.0 - 2013-02-06
* https://github.com/amazingSurge/sticker
* Copyright (c) 2013 amazingSurge; Licensed GPL */
(function(window, document, $, undefined) {
    "use strict";

    var $window = $(window),
        windowHeight = $window.height();

    var Global = {
        count: 0,
        started: false,
        instances: [],
        types: {},
        generateId: function() {
            this.count++;
            return this.count;
        },
        scroll: function() {
            $.each(Global.instances, function(i, instance) {
                if (instance.enabled) {
                    Global.types[instance.type].scroll(instance);

                    // fire custom scroll callback
                    if ($.isFunction(instance.options.scroll)) {
                        instance.options.scroll.call(instance);
                    }
                }
            });
        },
        resize: function() {
            windowHeight = $window.height();

            $.each(Global.instances, function(i, instance) {
                if (instance.enabled) {
                    Global.types[instance.type].resize(instance);
                    Global.types[instance.type].scroll(instance);
                    // fire custom resize callback
                    if ($.isFunction(instance.options.resize)) {
                        instance.options.resize.call(instance);
                    }
                }
            });
        },
        start: function() {
            if (!this.started) {
                $window.on('scroll', this.scroll);
                $window.on('resize', this.resize);
                this.started = true;
            }
        },
        stop: function() {
            this.started = false;
            $window.off('scroll', this.scroll);
            $window.off('resize', this.resize);
        }
    };

    // Constructor
    var Sticker = $.Sticker = function(element, options) {
        this.element = element;
        this.$element = $(element);

        // Get the type
        this.type = (options.type !== undefined) ? options.type : Sticker.defaults.type;
        // Merge the options
        this.options = $.extend({}, Sticker.defaults, Global.types[this.type].defaults, options);

        this.enabled = false;

        // Namespacing
        var namespace = this.options.namespace;

        // Class
        this.classes = {};
        this.classes.wrapper = namespace + '-wrapper';
        this.classes.enabled = namespace + '-enabled';

        this.components = {};

        // Initialization
        this.init();
    };

    // Default options for the plugin as a simple object
    Sticker.defaults = {
        namespace: 'sticker', // String: Prefix string attached to the class of every element generated by the plugin,
        type: 'top', // String: Select your sticky type, "top" or "bottom"

        // Callback API
        scroll: null, // Callback: function(api) - Fires when scroll
        resize: null // Callback: function(api) - Fires when resize
    };

    Sticker.registerType = function(name, type) {
        Global.types[name] = type;
    };

    Sticker.prototype = {
        constructor: Sticker,
        init: function() {
            this.id = Global.generateId();

            var $wrapper = $('<div></div>').addClass(this.classes.wrapper);
            this.$element.wrapAll($wrapper);

            this.$wrapper = this.$element.parent();

            Global.types[this.type].init(this);

            this.enable();

            // first fire
            Global.types[this.type].scroll(this);

            Global.instances.push(this);
            Global.start();
        },
        destroy: function() {
            this.$element.unwrap();

            for (var i in Global.instances) {
                if (Global.instances[i].id === this.id) {
                    Global.instances.splice(i, 1);
                }
            }

            if (Global.instances.length === 0) {
                Global.stop();
            }
        },
        enable: function() {
            this.enabled = true;
            this.$wrapper.addClass(this.classes.enabled);
        },
        disable: function() {
            this.enabled = false;
            Global.types[this.type].normalize(this);
            this.$wrapper.removeClass(this.classes.enabled);
        }
    };

    Sticker.registerType('top', {
        defaults: {
            topSpace: 0
        },
        init: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        scroll: function(api) {
            // in this case, the element should not have margin top and bottom value
            var scrollTop = $window.scrollTop(),
                elementTop = api.$wrapper.offset().top;

            if (api.options.topSpace > elementTop) {
                api.options.topSpace = elementTop;
            }

            var extra = elementTop - api.options.topSpace - scrollTop;
            if (extra < 0) {
                api.$element.css({
                    position: 'fixed',
                    top: api.options.topSpace
                });
            } else {
                api.$element.css({
                    position: '',
                    top: ''
                });
            }
        },
        resize: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        normalize: function(api){
            api.$element.css({
                position: '',
                top: ''
            });
        }
    });

    Sticker.registerType('bottom', {
        defaults: {
            bottomSpace: 0
        },
        init: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        scroll: function(api) {
            // in this case, the element should not have margin top and bottom value
            var scrollTop = $window.scrollTop(),
                elementTop = api.$wrapper.offset().top,
                elementHeight = api.$element.outerHeight();

            var extra = scrollTop - (elementTop - windowHeight + elementHeight + api.options.bottomSpace);
            if (extra < 0) {
                api.$element.css({
                    position: 'fixed',
                    bottom: api.options.bottomSpace
                });
            } else {
                api.$element.css({
                    position: '',
                    bottom: ''
                });
            }
        },
        resize: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        normalize: function(api){
            api.$element.css({
                position: '',
                bottom: ''
            });
        }
    });

    // Collection method.
    $.fn.sticker = function(options) {
        return this.each(function() {
            if (!$.data(this, 'sticker')) {
                $.data(this, 'sticker', new Sticker(this, options));
            }
        });
    };
}(window, document, jQuery));