// Input Formatting feature module
// Applies Maskito-based formatting to inputs with data-input attribute
// Supports: date:mmddyyyy, date:ddmmyyyy, time:hhmm am, time:hhmm pm
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@maskito/core", "@maskito/kit"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseFormat = parseFormat;
    exports.createMaskitoOptions = createMaskitoOptions;
    exports.initInputFormatting = initInputFormatting;
    var core_1 = require("@maskito/core");
    var kit_1 = require("@maskito/kit");
    function parseFormat(attr) {
        console.log('🔧 parseFormat called with attr:', JSON.stringify(attr));
        var normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
        console.log('🔧 normalized attr:', JSON.stringify(normalized));
        if (normalized === 'date:mmddyyyy') {
            console.log('🔧 Matched date:mmddyyyy');
            return { type: 'date', pattern: 'mmddyyyy' };
        }
        if (normalized === 'date:ddmmyyyy') {
            console.log('🔧 Matched date:ddmmyyyy');
            return { type: 'date', pattern: 'ddmmyyyy' };
        }
        if (normalized === 'time:hhmm am' || normalized === 'time:hhmm') {
            console.log('🔧 Matched time:hhmm am');
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
        }
        if (normalized === 'time:hhmm pm') {
            console.log('🔧 Matched time:hhmm pm');
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
        }
        console.log('🔧 No format match found for:', JSON.stringify(normalized));
        return null;
    }
    function createMaskitoOptions(config) {
        if (config.type === 'date') {
            var mode = config.pattern === 'mmddyyyy' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
            return (0, kit_1.maskitoDateOptionsGenerator)({
                mode: mode,
                separator: '/'
            });
        }
        else if (config.type === 'time') {
            return (0, kit_1.maskitoTimeOptionsGenerator)({
                mode: 'HH:MM AA'
            });
        }
        return null;
    }
    function initInputFormatting(form) {
        console.log('🔧 initInputFormatting called for form:', form);
        var inputs = form.querySelectorAll('input[data-input]');
        console.log("\uD83D\uDD27 Found ".concat(inputs.length, " inputs with data-input attribute"));
        inputs.forEach(function (el, index) {
            var input = el;
            var attr = input.getAttribute('data-input');
            console.log("\uD83D\uDD27 Input ".concat(index + 1, ":"), input, 'data-input value:', attr);
            if (!attr) {
                console.log("\uD83D\uDD27 Input ".concat(index + 1, " has no data-input attribute, skipping"));
                return;
            }
            var config = parseFormat(attr);
            console.log("\uD83D\uDD27 Input ".concat(index + 1, " parsed config:"), config);
            if (!config) {
                console.log("\uD83D\uDD27 Input ".concat(index + 1, " config parsing failed for attr:"), attr);
                return;
            }
            var maskitoOptions = createMaskitoOptions(config);
            console.log("\uD83D\uDD27 Input ".concat(index + 1, " maskito options:"), maskitoOptions);
            if (!maskitoOptions) {
                console.log("\uD83D\uDD27 Input ".concat(index + 1, " failed to create Maskito options"));
                return;
            }
            // Initialize Maskito on the input
            console.log("\uD83D\uDD27 Input ".concat(index + 1, " initializing Maskito..."));
            var maskito = new core_1.Maskito(input, maskitoOptions);
            console.log("\uD83D\uDD27 Input ".concat(index + 1, " Maskito initialized successfully:"), maskito);
            // Dispatch bound event
            input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
            console.log("\uD83D\uDD27 Input ".concat(index + 1, " bound event dispatched"));
            // Track changes for event dispatch
            var previousValue = input.value;
            input.addEventListener('input', function () {
                var newValue = input.value;
                if (newValue !== previousValue) {
                    input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
                        bubbles: true,
                        detail: { raw: previousValue, formatted: newValue }
                    }));
                    previousValue = newValue;
                }
            });
            input.addEventListener('blur', function () {
                var isValid = input.value.length === 0 || input.checkValidity();
                input.setAttribute('aria-invalid', (!isValid).toString());
                if (!isValid) {
                    input.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
                }
            });
            // Store maskito instance for cleanup if needed
            input.__maskito = maskito;
        });
    }
});
