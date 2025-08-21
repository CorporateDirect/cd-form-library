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
        var normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
        if (normalized === 'date:mmddyyyy')
            return { type: 'date', pattern: 'mmddyyyy' };
        if (normalized === 'date:ddmmyyyy')
            return { type: 'date', pattern: 'ddmmyyyy' };
        if (normalized === 'time:hhmm am' || normalized === 'time:hhmm')
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
        if (normalized === 'time:hhmm pm')
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
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
        var inputs = form.querySelectorAll('input[data-input]');
        inputs.forEach(function (el) {
            var input = el;
            var attr = input.getAttribute('data-input');
            if (!attr)
                return;
            var config = parseFormat(attr);
            if (!config)
                return;
            var maskitoOptions = createMaskitoOptions(config);
            if (!maskitoOptions)
                return;
            // Initialize Maskito on the input
            var maskito = new core_1.Maskito(input, maskitoOptions);
            // Dispatch bound event
            input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
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
