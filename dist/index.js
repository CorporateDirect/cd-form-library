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
    else {
        // Browser global case
        factory(null, window);
    }
})(function (require, exports) {
    "use strict";
    
    // Handle browser environment
    if (!exports) exports = {};
    
    // Import features - inline for browser compatibility
    var features_1;
    if (require) {
        features_1 = require("./features");
    } else {
        // Browser inline features
        features_1 = {
            initFormEnhancements: function(form) {
                console.log("Enhancing form: " + (form.id || form.name));
                // TODO: Implement scanning for data-cd-validate, etc.
            },
            initInputFormatting: function(form) {
                console.log('initInputFormatting called for form:', form);
                
                var inputs = form.querySelectorAll('input[data-input]');
                console.log("Found " + inputs.length + " inputs with data-input attribute");
                
                for (var i = 0; i < inputs.length; i++) {
                    var input = inputs[i];
                    var attr = input.getAttribute('data-input');
                    console.log("Input " + (i + 1) + ":", input, 'data-input value:', attr);
                    
                    if (!attr) {
                        console.log("Input " + (i + 1) + " has no data-input attribute, skipping");
                        continue;
                    }

                    var config = parseFormat(attr);
                    console.log("Input " + (i + 1) + " parsed config:", config);
                    
                    if (!config) {
                        console.log("Input " + (i + 1) + " config parsing failed, skipping");
                        continue;
                    }

                    console.log("Input " + (i + 1) + " successfully configured for formatting:", config);
                    input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

                    setupInputFormatting(input, config);
                }
            }
        };
        
        // Helper functions for browser inline version
        function parseFormat(attr) {
            var normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
            if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
            if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
            if (normalized === 'time:hhmm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
            return null;
        }
        
        function formatDate(raw, pattern) {
            var digits = raw.replace(/\D/g, '').slice(0, 8);
            var formatted = '';
            if (pattern === 'mmddyyyy') {
                if (digits.length >= 2) formatted += digits.slice(0, 2) + '/';
                if (digits.length >= 4) formatted += digits.slice(2, 4) + '/';
                if (digits.length > 4) formatted += digits.slice(4);
            } else {
                if (digits.length >= 2) formatted += digits.slice(0, 2) + '/';
                if (digits.length >= 4) formatted += digits.slice(2, 4) + '/';
                if (digits.length > 4) formatted += digits.slice(4);
            }
            return formatted;
        }
        
        function formatTime(raw, defaultMeridiem) {
            var cleaned = raw.toUpperCase().replace(/[^0-9AP]/g, '');
            var numPart = cleaned.replace(/[AP]/g, '').slice(0, 4);
            var meridiemMatch = cleaned.match(/[AP]+$/);
            var meridiem = meridiemMatch ? (meridiemMatch[0].indexOf('A') === 0 ? 'AM' : 'PM') : defaultMeridiem;

            var formatted = '';
            if (numPart.length >= 2) formatted += numPart.slice(0, 2) + ':';
            if (numPart.length > 2) formatted += numPart.slice(2);
            if (numPart.length >= 2) formatted += ' ' + meridiem;
            return formatted;
        }
        
        function preserveCaret(input, oldValue, newValue, oldCaret) {
            var rawOld = oldValue.replace(/[^0-9a-zA-Z]/g, '');
            var rawPos = rawOld.slice(0, oldCaret).length;

            var newPos = 0;
            var rawCount = 0;
            for (var i = 0; i < newValue.length; i++) {
                if (/[0-9a-zA-Z]/.test(newValue[i])) rawCount++;
                if (rawCount > rawPos) break;
                newPos = i + 1;
            }

            input.setSelectionRange(newPos, newPos);
        }
        
        function setupInputFormatting(input, config) {
            var handleInput = function(event) {
                console.log("Input event triggered for " + config.type + " field:", input);
                
                var oldValue = input.value;
                var oldCaret = input.selectionStart || 0;
                console.log('Old value:', oldValue, 'Old caret:', oldCaret);

                var raw = input.value;
                var formatted;

                if (config.type === 'date') {
                    formatted = formatDate(raw, config.pattern);
                    console.log('Date formatting - raw:', raw, 'formatted:', formatted);
                } else {
                    formatted = formatTime(raw, config.defaultMeridiem);
                    console.log('Time formatting - raw:', raw, 'formatted:', formatted);
                }

                input.value = formatted;
                preserveCaret(input, oldValue, formatted, oldCaret);
                console.log('Final value set:', input.value);

                input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
                    bubbles: true,
                    detail: { raw: raw, formatted: formatted }
                }));
            };

            var handleBlur = function() {
                // Simple autocorrect for browser version
                input.setAttribute('aria-invalid', 'false');
                handleInput(new Event('input'));
            };

            input.addEventListener('input', handleInput);
            input.addEventListener('change', handleInput);
            input.addEventListener('blur', handleBlur);

            if (input.value) handleInput(new Event('input'));
        }
    }
    
    exports.initFormEnhancements = features_1.initFormEnhancements;
    exports.initInputFormatting = features_1.initInputFormatting;
    // Get version from package.json - will be replaced during build
    var VERSION = '0.1.16';
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
