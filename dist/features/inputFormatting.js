// Input Formatting feature module
// Applies soft masking to inputs with data-input attribute (e.g., dates, times)
// Adheres to rules: natural editing, caret preservation, autocorrect on blur, events
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
    exports.initInputFormatting = initInputFormatting;
    function parseFormat(attr) {
        var normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
        if (normalized === 'date:mmddyyyy')
            return { type: 'date', pattern: 'mmddyyyy' };
        if (normalized === 'date:ddmmyyyy')
            return { type: 'date', pattern: 'ddmmyyyy' };
        if (normalized === 'time:hhmm')
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' }; // Unified, default AM
        return null;
    }
    function formatDate(raw, pattern) {
        var digits = raw.replace(/\D/g, '').slice(0, 8);
        var formatted = '';
        if (pattern === 'mmddyyyy') {
            if (digits.length >= 1)
                formatted += digits.slice(0, 2);
            if (digits.length >= 3)
                formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4);
            if (digits.length >= 5)
                formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
        }
        else { // ddmmyyyy
            if (digits.length >= 1)
                formatted += digits.slice(0, 2);
            if (digits.length >= 3)
                formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4);
            if (digits.length >= 5)
                formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
        }
        return formatted;
    }
    function formatTime(raw, defaultMeridiem) {
        var cleaned = raw.toUpperCase().replace(/[^0-9AP]/g, '');
        var numPart = cleaned.replace(/[AP]/g, '').slice(0, 4);
        var meridiemMatch = cleaned.match(/[AP]+$/);
        var meridiem = meridiemMatch ? (meridiemMatch[0].startsWith('A') ? 'AM' : 'PM') : defaultMeridiem;
        var formatted = '';
        if (numPart.length >= 2)
            formatted += numPart.slice(0, 2) + ':';
        if (numPart.length > 2)
            formatted += numPart.slice(2);
        if (numPart.length >= 2)
            formatted += ' ' + meridiem;
        return formatted;
    }
    function autocorrectDate(value, pattern) {
        var _a;
        var parts = value.split('/').map(function (p) { return p.padStart(2, '0'); });
        var month = parseInt(parts[0] || '00', 10);
        var day = parseInt(parts[1] || '00', 10);
        var year = parts[2] || '';
        if (pattern === 'ddmmyyyy')
            _a = [month, day], day = _a[0], month = _a[1]; // Swap for EU format
        month = Math.max(1, Math.min(12, month));
        day = Math.max(1, Math.min(31, day)); // Basic clamp; no month-specific max yet
        var isValid = year.length === 4 && day <= new Date(parseInt(year, 10), month, 0).getDate(); // Simple invalid check
        var formattedMonth = month.toString().padStart(2, '0');
        var formattedDay = day.toString().padStart(2, '0');
        var corrected = pattern === 'mmddyyyy'
            ? "".concat(formattedMonth, "/").concat(formattedDay, "/").concat(year)
            : "".concat(formattedDay, "/").concat(formattedMonth, "/").concat(year);
        return { corrected: corrected, isValid: year.length === 4 && isValid };
    }
    // Update autocorrectTime to handle unified default
    function autocorrectTime(value, defaultMeridiem) {
        var _a;
        var parts = value.split(/[: ]/);
        var hour = parseInt(parts[0] || '00', 10);
        var minute = parseInt(parts[1] || '00', 10);
        var meridiem = ((_a = parts[2]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || defaultMeridiem;
        if (!['AM', 'PM'].includes(meridiem))
            meridiem = defaultMeridiem;
        hour = Math.max(1, Math.min(12, hour));
        minute = Math.max(0, Math.min(59, minute));
        var isValid = true;
        var corrected = "".concat(hour.toString().padStart(2, '0'), ":").concat(minute.toString().padStart(2, '0'), " ").concat(meridiem);
        return { corrected: corrected, isValid: isValid };
    }
    function preserveCaret(input, oldValue, newValue, oldCaret) {
        // Simple mapping: count non-derived chars before oldCaret, place after same count in newValue
        var rawOld = oldValue.replace(/[^0-9a-zA-Z]/g, ''); // Strip derived
        var rawPos = rawOld.slice(0, oldCaret).length;
        var newPos = 0;
        var rawCount = 0;
        for (var i = 0; i < newValue.length; i++) {
            if (/[0-9a-zA-Z]/.test(newValue[i]))
                rawCount++;
            if (rawCount > rawPos)
                break;
            newPos = i + 1; // Place after the matching raw char
        }
        input.setSelectionRange(newPos, newPos);
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
            console.log("Input ".concat(index + 1, " successfully configured for formatting:"), config);
            input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
            var handleInput = function (event) {
                console.log("Input event triggered for ".concat(config.type, " field:"), input);
                var oldValue = input.value;
                var oldCaret = input.selectionStart || 0;
                console.log('Old value:', oldValue, 'Old caret:', oldCaret);
                var raw = input.value;
                var formatted;
                if (config.type === 'date') {
                    formatted = formatDate(raw, config.pattern);
                    console.log('Date formatting - raw:', raw, 'formatted:', formatted);
                }
                else {
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
            var handleBlur = function () {
                var _a = config.type === 'date'
                    ? autocorrectDate(input.value, config.pattern)
                    : autocorrectTime(input.value, config.defaultMeridiem), corrected = _a.corrected, isValid = _a.isValid;
                input.value = corrected;
                input.setAttribute('aria-invalid', (!isValid).toString());
                if (!isValid) {
                    input.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
                }
                handleInput(new Event('input')); // Re-trigger format
            };
            input.addEventListener('input', handleInput);
            input.addEventListener('change', handleInput);
            input.addEventListener('blur', handleBlur);
            // Initial format if value present
            if (input.value)
                handleInput(new Event('input'));
        });
    }
});
