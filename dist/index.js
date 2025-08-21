// Entry point for the library
// Auto-initializes on DOMContentLoaded
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./features"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initializeLibrary = initializeLibrary;
    const features_1 = require("./features"); // Updated import
    function initializeLibrary() {
        console.log('CD Form Library initializing...');
        console.log('Document ready state:', document.readyState);
        const forms = document.querySelectorAll('form[data-cd-form="true"]');
        console.log(`Found ${forms.length} forms with data-cd-form="true"`);
        forms.forEach((form, index) => {
            console.log(`Processing form ${index + 1}:`, form);
            (0, features_1.initFormEnhancements)(form);
            (0, features_1.initInputFormatting)(form);
        });
        console.log(`Enhanced ${forms.length} forms.`);
    }
    // Auto-init on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLibrary);
    }
    else {
        initializeLibrary();
    }
});
