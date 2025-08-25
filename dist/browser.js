// Browser-specific build for cd-form-library
// This will be compiled to a simple IIFE for direct browser use
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@maskito/core", "@maskito/kit", "./features/dynamicRows", "./features/formWrapperVisibility"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require("@maskito/core");
    var kit_1 = require("@maskito/kit");
    var dynamicRows_1 = require("./features/dynamicRows");
    var formWrapperVisibility_1 = require("./features/formWrapperVisibility");
    var VERSION = '0.1.23';
    function parseFormat(attr) {
        var normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
        if (normalized === 'date:mmddyyyy') {
            return { type: 'date', pattern: 'mmddyyyy' };
        }
        if (normalized === 'date:ddmmyyyy') {
            return { type: 'date', pattern: 'ddmmyyyy' };
        }
        if (normalized === 'time:hhmm am' || normalized === 'time:hhmm') {
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
        }
        if (normalized === 'time:hhmm pm') {
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
        }
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
    // Form wrapper visibility is imported from the feature module
    function initializeLibrary() {
        var forms = document.querySelectorAll('form[data-cd-form="true"]');
        forms.forEach(function (form) {
            var formElement = form;
            try {
                // Initialize input formatting for inputs with data-input attribute
                initInputFormatting(formElement);
                // Initialize form wrapper visibility for elements with data-show-when
                (0, formWrapperVisibility_1.initFormWrapperVisibility)();
                // Initialize dynamic rows for repeatable sections
                (0, dynamicRows_1.initDynamicRows)();
                // Dispatch custom event for form enhancement completion
                formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
            }
            catch (error) {
                console.error('Error enhancing form:', error);
            }
        });
    }
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLibrary);
    }
    else {
        initializeLibrary();
    }
    // Global exposure for browser environments
    window.CDFormLibrary = {
        version: VERSION,
        initialize: initializeLibrary
    };
});
