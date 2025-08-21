"use strict";
// Entry point for the library
// Auto-initializes on DOMContentLoaded
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeLibrary = initializeLibrary;
const features_1 = require("./features"); // To be implemented
function initializeLibrary() {
    console.log('CD Form Library initializing...');
    const forms = document.querySelectorAll('form[data-cd-form="true"]');
    forms.forEach(form => {
        (0, features_1.initFormEnhancements)(form);
        initInputFormatting(form); // Add input formatting
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
