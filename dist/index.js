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
    const features_1 = require("./features");
    Object.defineProperty(exports, "initFormEnhancements", { enumerable: true, get: function () { return features_1.initFormEnhancements; } });
    Object.defineProperty(exports, "initInputFormatting", { enumerable: true, get: function () { return features_1.initInputFormatting; } });
    // Immediate debug log to confirm script execution
    console.log('🚀 CD Form Library v0.1.15 - Script executing!');
    console.log('🚀 Document state:', document.readyState);
    console.log('🚀 Window object:', typeof window);
    function initializeLibrary() {
        console.log('🚀 CD Form Library initializing...');
        console.log('🚀 Document ready state:', document.readyState);
        const forms = document.querySelectorAll('form[data-cd-form="true"]');
        console.log(`🚀 Found ${forms.length} forms with data-cd-form="true"`);
        if (forms.length === 0) {
            console.log('🚀 No forms found - checking all forms on page...');
            const allForms = document.querySelectorAll('form');
            console.log(`🚀 Total forms on page: ${allForms.length}`);
            allForms.forEach((form, i) => {
                console.log(`🚀 Form ${i + 1}:`, form, 'data-cd-form:', form.getAttribute('data-cd-form'));
            });
        }
        forms.forEach((form, index) => {
            console.log(`🚀 Processing form ${index + 1}:`, form);
            try {
                (0, features_1.initFormEnhancements)(form);
                (0, features_1.initInputFormatting)(form);
                console.log(`🚀 Form ${index + 1} enhanced successfully`);
            }
            catch (error) {
                console.error(`🚀 Error enhancing form ${index + 1}:`, error);
            }
        });
        console.log(`🚀 Enhanced ${forms.length} forms.`);
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
    setTimeout(() => {
        console.log('🚀 Backup initialization after 2 seconds...');
        initializeLibrary();
    }, 2000);
    // Global exposure for browser environments
    if (typeof window !== 'undefined') {
        window.CDFormLibrary = {
            version: '0.1.15',
            initialize: initializeLibrary,
            features: {
                initFormEnhancements: features_1.initFormEnhancements,
                initInputFormatting: features_1.initInputFormatting
            }
        };
        console.log('🚀 CDFormLibrary exposed on window object');
    }
});
