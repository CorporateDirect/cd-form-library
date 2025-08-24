// CD Form Library - Entry point
// Auto-initializes on DOMContentLoaded per Webflow rules
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./features/inputFormatting", "./features/formWrapperVisibility"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initializeLibrary = initializeLibrary;
    var inputFormatting_1 = require("./features/inputFormatting");
    var formWrapperVisibility_1 = require("./features/formWrapperVisibility");
    var VERSION = '0.1.63';
    function initializeLibrary() {
        console.log('🚀 CD Form Library v' + VERSION + ' initializing...');
        console.log('🚀 Document ready state:', document.readyState);
        var forms = document.querySelectorAll('form[data-cd-form="true"]');
        console.log("\uD83D\uDE80 Found ".concat(forms.length, " forms with data-cd-form=\"true\""));
        if (forms.length === 0) {
            console.log('🚀 No CD forms found, checking all forms on page...');
            var allForms = document.querySelectorAll('form');
            console.log("\uD83D\uDE80 Total forms on page: ".concat(allForms.length));
            allForms.forEach(function (form, i) {
                console.log("\uD83D\uDE80 Form ".concat(i + 1, ":"), form, 'data-cd-form:', form.getAttribute('data-cd-form'));
            });
        }
        forms.forEach(function (form, index) {
            var formElement = form;
            console.log("\uD83D\uDE80 Processing form ".concat(index + 1, ":"), formElement);
            try {
                // Initialize input formatting for inputs with data-input attribute
                (0, inputFormatting_1.initInputFormatting)(formElement);
                // Initialize form wrapper visibility for elements with data-show-when
                (0, formWrapperVisibility_1.initFormWrapperVisibility)();
                // Dispatch custom event for form enhancement completion
                formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
                console.log("\uD83D\uDE80 Form ".concat(index + 1, " enhanced successfully"));
            }
            catch (error) {
                console.error("\uD83D\uDE80 Error enhancing form ".concat(index + 1, ":"), error);
            }
        });
        console.log("\uD83D\uDE80 Library initialization complete - enhanced ".concat(forms.length, " forms"));
    }
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLibrary);
    }
    else {
        initializeLibrary();
    }
    // Global exposure for browser environments
    if (typeof window !== 'undefined') {
        window.CDFormLibrary = {
            version: VERSION,
            initialize: initializeLibrary
        };
    }
});
