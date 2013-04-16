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
        this.sticky = false;

        // Namespacing
        var namespace = this.options.namespace;

        // Class
        this.classes = {};
        this.classes.wrapper = namespace + '-wrapper';
        this.classes.enabled = namespace + '-enabled';
        this.classes.sticky = namespace + '-sticky';

        this.components = {};

        // Initialization
        this.init();
    };

    // Default options for the plugin as a simple object
    Sticker.defaults = {
        namespace: 'sticker', // String: Prefix string attached to the class of every element generated by the plugin,
        type: 'top', // String: Select your sticky type, "top", "bottom", "fill" or "sidebar"

        // Callback API
        init: null, // Callback: function() - Fires when init
        destroy: null, // Callback: function() - Fires when destroy
        scroll: null, // Callback: function() - Fires when scroll
        resize: null, // Callback: function() - Fires when resize
        enable: null, // Callback: function() - Fires when enable sticky
        disable: null, // Callback: function() - Fires when disable sticky
        sticky: null, // Callback: function() - Fires when sticky
        unsticky: null // Callback: function() - Fires when unsticky
    };

    Sticker.registerType = function(name, type) {
        Global.types[name] = type;
    };

    Sticker.prototype = {
        constructor: Sticker,
        init: function() {
            this.id = Global.generateId();

            var $wrapper = $('<div></div>').addClass(this.classes.wrapper);

            var id = this.$element.attr('id');

            if (typeof id !== 'undefined') {
                $wrapper.attr('id', id + '-' + this.classes.wrapper);
            }

            this.$element.wrapAll($wrapper);
            this.$wrapper = this.$element.parent();

            //initial type
            Global.types[this.type].init(this);

            // fire custom init callback
            if ($.isFunction(this.options.init)) {
                this.options.init.call(this);
            }
            this.enable();

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

            if ($.isFunction(this.options.destroy)) {
                this.options.destroy.call(this);
            }
        },
        enable: function() {
            this.enabled = true;
            Global.types[this.type].enable(this);
            Global.types[this.type].scroll(this);
            this.$wrapper.addClass(this.classes.enabled);

            // fire custom enable callback
            if ($.isFunction(this.options.enable)) {
                this.options.enable.call(this);
            }
        },
        disable: function() {
            this.enabled = false;
            this.sticky = false;
            Global.types[this.type].disable(this);
            this.$wrapper.removeClass(this.classes.sticky).removeClass(this.classes.enabled);

            // fire custom disable callback
            if ($.isFunction(this.options.disable)) {
                this.options.disable.call(this);
            }
        },
        on: function(e, callback) {
            if (typeof e === "string" && typeof callback === "function") {
                this.options[e] = callback;
            }
        },
        off: function(e) {
            if (typeof e === "string") {
                this.options[e] = null;
            }
        },
        set: function(option, value) {
            this.options[option] = value;
        },
        update: function() {
            if (this.enabled) {
                Global.types[this.type].scroll(this);
            }
        }
    };

    Sticker.registerType('top', {
        defaults: {
            topSpace: 0
        },
        init: function(api) {},
        scroll: function(api) {
            // in this case, the element should not have margin top and bottom value
            var scrollTop = $window.scrollTop(),
                elementTop = api.$wrapper.offset().top,
                topSpace = api.options.topSpace;
            if (topSpace > elementTop && elementTop >= 0) {
                topSpace = elementTop;
            }

            var extra = elementTop - topSpace - scrollTop;
            if (extra < 0) {
                if (!api.sticky) {
                    api.sticky = true;
                    api.$wrapper.addClass(api.classes.sticky);
                    api.$element.css({
                        position: 'fixed',
                        top: topSpace
                    });
                    // fire custom sticky callback
                    if ($.isFunction(api.options.sticky)) {
                        api.options.sticky.call(api);
                    }
                }
            } else {
                if (api.sticky) {
                    api.sticky = false;
                    api.$wrapper.removeClass(api.classes.sticky);
                    api.$element.css({
                        position: '',
                        top: ''
                    });
                    // fire custom unsticky callback
                    if ($.isFunction(api.options.unsticky)) {
                        api.options.unsticky.call(api);
                    }
                }
            }
        },
        resize: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        enable: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        disable: function(api) {
            api.$element.css({
                position: '',
                top: ''
            });
            api.$wrapper.css('height', '');
        }
    });

    Sticker.registerType('fill', {
        defaults: {
            check: true,
            callback: null, // Callback: function(api) - Fires when fill,
            adjustHeight: null // Callback: function(api, documentHeight, windowHeight)
        },
        init: function(api) {},
        scroll: function(api) {
            var scrollTop = $window.scrollTop(),
                documentHeight = $('body').height();

            if ($.isFunction(api.options.adjustHeight)) {
                documentHeight = api.options.adjustHeight.call(api, documentHeight, windowHeight);
            }
            if (scrollTop === 0 && documentHeight <= windowHeight) {
                if (!api.sticky) {
                    api.sticky = true;
                    api.$wrapper.addClass(api.classes.sticky);
                    api.$element.css({
                        position: 'fixed',
                        bottom: 0
                    });
                    // fire custom sticky callback
                    if ($.isFunction(api.options.sticky)) {
                        api.options.sticky.call(api);
                    }
                }
            } else {
                if (api.sticky) {
                    api.sticky = false;
                    api.$wrapper.removeClass(api.classes.sticky);
                    api.$element.css({
                        position: '',
                        bottom: ''
                    });
                    // fire custom unsticky callback
                    if ($.isFunction(api.options.unsticky)) {
                        api.options.unsticky.call(api);
                    }
                }
            }

            // fire custom callback
            if ($.isFunction(api.options.callback)) {
                api.options.callback.call(api, scrollTop, documentHeight, windowHeight);
            }
        },
        resize: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        enable: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
            if (api.options.check) {
                var original = $('body').height();
                api.checkInterval = setInterval(function() {
                    if (original !== $('body').height()) {
                        Global.types[api.type].scroll(api);
                        original = $('body').height();
                    }
                }, 500);
            }
        },
        disable: function(api) {
            if (api.options.check) {
                clearInterval(api.checkInterval);
            }
            api.$element.css({
                position: '',
                bottom: ''
            });
            api.$wrapper.css('height', '');
        }
    });

    Sticker.registerType('bottom', {
        defaults: {
            bottomSpace: 0
        },
        init: function(api) {},
        scroll: function(api) {
            // in this case, the element should not have margin top and bottom value
            var scrollTop = $window.scrollTop(),
                elementTop = api.$wrapper.offset().top,
                elementHeight = api.$element.outerHeight();

            var extra = scrollTop - (elementTop - windowHeight + elementHeight + api.options.bottomSpace);
            if (extra < 0) {
                if (!api.sticky) {
                    api.sticky = true;
                    api.$wrapper.addClass(api.classes.sticky);
                    api.$element.css({
                        position: 'fixed',
                        bottom: api.options.bottomSpace
                    });
                    // fire custom sticky callback
                    if ($.isFunction(api.options.sticky)) {
                        api.options.sticky.call(api);
                    }
                }
            } else {
                if (api.sticky) {
                    api.sticky = false;
                    api.$wrapper.removeClass(api.classes.sticky);
                    api.$element.css({
                        position: '',
                        bottom: ''
                    });
                    // fire custom unsticky callback
                    if ($.isFunction(api.options.unsticky)) {
                        api.options.unsticky.call(api);
                    }
                }
            }
        },
        resize: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        enable: function(api) {
            api.$wrapper.css('height', api.$element.outerHeight());
        },
        disable: function(api) {
            api.$element.css({
                position: '',
                bottom: ''
            });
            api.$wrapper.css('height', '');
        }
    });

    Sticker.registerType('sidebar', {
        defaults: {
            topSpace: 0, // how many pixels to pad the element from the top of the window
            container: null
        },
        init: function(api) {
            if (!api.options.container) {
                api.$container = api.$wrapper.parent();
            } else {
                api.$container = $(api.options.container);
            }

            api.containerHeight = api.$container.height();
            api.containerTop = api.$container.offset().top;
        },
        scroll: function(api) {
            var scrollTop = $window.scrollTop(),
                elementTop = api.$wrapper.offset().top,
                elementHeight = api.$element.outerHeight();

            var extra = scrollTop - elementTop + api.options.topSpace;

            if (extra > 0) {
                if (!api.sticky) {
                    api.sticky = true;
                    api.$wrapper.addClass(api.classes.sticky);
                }
                var constraint = api.containerHeight - elementHeight + api.containerTop - elementTop;

                if (extra > constraint) {
                    api.$wrapper.css({
                        paddingTop: constraint
                    });
                } else {
                    api.$wrapper.css({
                        paddingTop: extra
                    });
                }
                // fire custom sticky callback
                if ($.isFunction(api.options.sticky)) {
                    api.options.sticky.call(api);
                }
            } else {
                if (api.sticky) {
                    api.sticky = false;
                    api.$wrapper.removeClass(api.classes.sticky);
                    api.$wrapper.css({
                        paddingTop: ''
                    });
                    // fire custom unsticky callback
                    if ($.isFunction(api.options.unsticky)) {
                        api.options.unsticky.call(api);
                    }
                }
            }
        },
        resize: function(api) {
            api.containerHeight = api.$container.height();
            api.containerTop = api.$container.offset().top;
        },
        enable: function(api) {

        },
        disable: function(api) {
            api.$wrapper.css({
                paddingTop: ''
            });
        }
    });

    // Collection method.
    $.fn.sticker = function(options) {
        if (typeof options === 'string') {
            var method = options;
            var method_arguments = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : undefined;

            return this.each(function() {
                var api = $.data(this, 'sticker');

                if (api && typeof api[method] === 'function') {
                    api[method].apply(api, method_arguments);
                }
            });
        } else {
            return this.each(function() {
                if (!$.data(this, 'sticker')) {
                    $.data(this, 'sticker', new Sticker(this, options));
                }
            });
        }
    };
}(window, document, jQuery));