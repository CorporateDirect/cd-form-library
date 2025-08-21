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
    exports.initInputFormatting = exports.initFormEnhancements = void 0;
    exports.initializeLibrary = initializeLibrary;
    var features_1 = require("./features");
    Object.defineProperty(exports, "initFormEnhancements", { enumerable: true, get: function () { return features_1.initFormEnhancements; } });
    Object.defineProperty(exports, "initInputFormatting", { enumerable: true, get: function () { return features_1.initInputFormatting; } });
    // Get version from package.json - will be replaced during build
    var VERSION = '0.1.17';
    // Immediate debug log to confirm script execution
    console.log("\uD83D\uDE80 CD Form Library v".concat(VERSION, " - Script executing!"));
    console.log('🚀 Document state:', document.readyState);
    console.log('🚀 Window object:', typeof window);
    function initializeLibrary() {
        console.log('🚀 CD Form Library initializing...');
        console.log('🚀 Document ready state:', document.readyState);
        var forms = document.querySelectorAll('form[data-cd-form="true"]');
        console.log("\uD83D\uDE80 Found ".concat(forms.length, " forms with data-cd-form=\"true\""));
        if (forms.length === 0) {
            console.log('🚀 No forms found - checking all forms on page...');
            var allForms = document.querySelectorAll('form');
            console.log("\uD83D\uDE80 Total forms on page: ".concat(allForms.length));
            allForms.forEach(function (form, i) {
                console.log("\uD83D\uDE80 Form ".concat(i + 1, ":"), form, 'data-cd-form:', form.getAttribute('data-cd-form'));
            });
        }
        forms.forEach(function (form, index) {
            console.log("\uD83D\uDE80 Processing form ".concat(index + 1, ":"), form);
            try {
                (0, features_1.initFormEnhancements)(form);
                (0, features_1.initInputFormatting)(form);
                console.log("\uD83D\uDE80 Form ".concat(index + 1, " enhanced successfully"));
            }
            catch (error) {
                console.error("\uD83D\uDE80 Error enhancing form ".concat(index + 1, ":"), error);
            }
        });
        console.log("\uD83D\uDE80 Enhanced ".concat(forms.length, " forms."));
    }
    // Auto-init on page load
    console.log('🚀 Setting up initialization...');
    if (document.readyState === 'loading') {
        console.log('🚀 Document still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', initializeLibrary);
    }
    else {
        console.log('🚀 Document ready, initializing immediately...');
        initializeLibrary();
    }
    // Also try to initialize after a delay as backup
    setTimeout(function () {
        console.log('🚀 Backup initialization after 2 seconds...');
        initializeLibrary();
    }, 2000);
    // Global exposure for browser environments
    if (typeof window !== 'undefined') {
        window.CDFormLibrary = {
            version: VERSION,
            initialize: initializeLibrary,
            features: {
                initFormEnhancements: features_1.initFormEnhancements,
                initInputFormatting: features_1.initInputFormatting
            }
        };
        console.log('🚀 CDFormLibrary exposed on window object');
    }
});
