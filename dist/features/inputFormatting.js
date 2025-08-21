// Input Formatting feature module
// Applies soft masking to inputs with data-input attribute (e.g., dates, times)
// Adheres to rules: natural editing, caret preservation, autocorrect on blur, events
// Uses Maskito library for robust input formatting
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
    exports.initInputFormatting = initInputFormatting;
    var core_1 = require("@maskito/core");
    var kit_1 = require("@maskito/kit");
    function parseFormat(attr) {
        var normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
        if (normalized === 'date:mmddyyyy')
            return { type: 'date', pattern: 'mmddyyyy' };
        if (normalized === 'date:ddmmyyyy')
            return { type: 'date', pattern: 'ddmmyyyy' };
        if (normalized === 'time:hhmm')
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
        return null;
    }
    function createMaskitoOptions(config) {
        if (config.type === 'date') {
            // Configure Maskito for date formatting
            var mode = config.pattern === 'mmddyyyy' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
            return (0, kit_1.maskitoDateOptionsGenerator)({
                mode: mode,
                separator: '/'
            });
        }
        else if (config.type === 'time') {
            // Configure Maskito for time formatting
            return (0, kit_1.maskitoTimeOptionsGenerator)({
                mode: 'HH:MM AA'
            });
        }
        return null;
    }
    function initInputFormatting(form) {
        console.log('initInputFormatting called for form:', form);
        var inputs = form.querySelectorAll('input[data-input]');
        console.log("Found ".concat(inputs.length, " inputs with data-input attribute"));
        inputs.forEach(function (el, index) {
            var input = el;
            var attr = input.getAttribute('data-input');
            console.log("Input ".concat(index + 1, ":"), input, 'data-input value:', attr);
            if (!attr) {
                console.log("Input ".concat(index + 1, " has no data-input attribute, skipping"));
                return;
            }
            var config = parseFormat(attr);
            console.log("Input ".concat(index + 1, " parsed config:"), config);
            if (!config) {
                console.log("Input ".concat(index + 1, " config parsing failed, skipping"));
                return;
            }
            // Create Maskito options for this input type
            var maskitoOptions = createMaskitoOptions(config);
            if (!maskitoOptions) {
                console.log("Input ".concat(index + 1, " failed to create Maskito options, skipping"));
                return;
            }
            console.log("Input ".concat(index + 1, " successfully configured for formatting:"), config);
            // Initialize Maskito on the input
            var maskito = new core_1.Maskito(input, maskitoOptions);
            // Dispatch bound event
            input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
            // Add custom event listeners for our library events
            var originalValue = input.value;
            input.addEventListener('input', function () {
                var newValue = input.value;
                if (newValue !== originalValue) {
                    input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
                        bubbles: true,
                        detail: { raw: originalValue, formatted: newValue }
                    }));
                }
            });
            input.addEventListener('blur', function () {
                // Maskito handles validation, we just need to check if it's valid
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
