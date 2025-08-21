// Form Wrapper Visibility feature module
// Manages conditional visibility of form wrappers based on data-show-when attribute
// Format: data-show-when="<group>=<value>"
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initFormWrapperVisibility = initFormWrapperVisibility;
    function initFormWrapperVisibility() {
        var wrappers = document.querySelectorAll('[data-show-when]');
        // Track all input groups that wrappers are listening to
        var groupListeners = new Map();
        wrappers.forEach(function (wrapper) {
            var condition = wrapper.getAttribute('data-show-when');
            if (!condition)
                return;
            var _a = condition.split('=').map(function (s) { return s.trim(); }), group = _a[0], value = _a[1];
            if (!group || value === undefined)
                return;
            // Track this wrapper as listening to this group
            if (!groupListeners.has(group)) {
                groupListeners.set(group, new Set());
            }
            groupListeners.get(group).add(wrapper);
            // Set initial visibility
            updateWrapperVisibility(wrapper, group, value);
        });
        // Attach event listeners to input groups
        groupListeners.forEach(function (wrappers, group) {
            var inputs = document.querySelectorAll("input[name=\"".concat(group, "\"], select[name=\"").concat(group, "\"], textarea[name=\"").concat(group, "\"]"));
            inputs.forEach(function (input) {
                input.addEventListener('change', function () {
                    wrappers.forEach(function (wrapper) {
                        var condition = wrapper.getAttribute('data-show-when');
                        if (!condition)
                            return;
                        var _a = condition.split('=').map(function (s) { return s.trim(); }), value = _a[1];
                        updateWrapperVisibility(wrapper, group, value);
                    });
                });
            });
        });
    }
    function updateWrapperVisibility(wrapper, group, targetValue) {
        var inputs = document.querySelectorAll("input[name=\"".concat(group, "\"], select[name=\"").concat(group, "\"], textarea[name=\"").concat(group, "\"]"));
        var currentValue = '';
        // Get current value from inputs
        inputs.forEach(function (input) {
            var el = input;
            if (el.type === 'radio' || el.type === 'checkbox') {
                var radioInput = el;
                if (radioInput.checked) {
                    currentValue = radioInput.value;
                }
            }
            else {
                currentValue = el.value;
            }
        });
        var shouldShow = currentValue === targetValue;
        var htmlWrapper = wrapper;
        if (shouldShow) {
            htmlWrapper.style.display = '';
            htmlWrapper.removeAttribute('aria-hidden');
            // Make focusable elements accessible again
            var focusableElements = htmlWrapper.querySelectorAll('input, select, textarea, button, [tabindex]');
            focusableElements.forEach(function (el) {
                el.removeAttribute('tabindex');
            });
            // Dispatch shown event
            wrapper.dispatchEvent(new CustomEvent('form-wrapper-visibility:shown', { bubbles: true }));
        }
        else {
            htmlWrapper.style.display = 'none';
            htmlWrapper.setAttribute('aria-hidden', 'true');
            // Remove from tab order
            var focusableElements = htmlWrapper.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
            focusableElements.forEach(function (el) {
                el.setAttribute('tabindex', '-1');
            });
            // Dispatch hidden event
            wrapper.dispatchEvent(new CustomEvent('form-wrapper-visibility:hidden', { bubbles: true }));
        }
    }
});
