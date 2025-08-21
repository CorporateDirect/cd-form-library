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
    var VERSION = '0.1.20';
    function initializeLibrary() {
        var forms = document.querySelectorAll('form[data-cd-form="true"]');
        forms.forEach(function (form) {
            var formElement = form;
            // Initialize input formatting for inputs with data-input attribute
            (0, inputFormatting_1.initInputFormatting)(formElement);
            // Initialize form wrapper visibility for elements with data-show-when
            (0, formWrapperVisibility_1.initFormWrapperVisibility)();
            // Dispatch custom event for form enhancement completion
            formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
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
    if (typeof window !== 'undefined') {
        window.CDFormLibrary = {
            version: VERSION,
            initialize: initializeLibrary
        };
    }
});
