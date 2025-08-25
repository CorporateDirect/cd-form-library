// Browser-specific build for cd-form-library
// This will be compiled to a simple IIFE for direct browser use
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@maskito/core", "@maskito/kit"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require("@maskito/core");
    var kit_1 = require("@maskito/kit");
    var VERSION = '0.1.66';
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
    // Form wrapper visibility implementation
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
    var activeGroups = new Map();
    function initDynamicRows() {
        var repeaterGroups = document.querySelectorAll('[data-cd-repeat-group]');
        repeaterGroups.forEach(function (container) {
            var groupName = container.getAttribute('data-cd-repeat-group');
            if (!groupName)
                return;
            // Skip if container is hidden (will be reinitialized when shown)
            if (window.getComputedStyle(container).display === 'none') {
                return;
            }
            initializeDynamicRowGroup(groupName, container);
        });
    }
    function initializeDynamicRowGroup(groupName, container) {
        // Find template row and add button
        var template = container.querySelector('[data-cd-repeat-template]');
        var addButton = container.querySelector('[data-cd-add-row]');
        var namePattern = container.getAttribute('data-cd-name-pattern') || "".concat(groupName, "[{i}]");
        if (!template)
            return;
        // Get existing rows
        var existingRows = Array.from(container.querySelectorAll('[data-cd-repeat-row]'));
        var group = {
            groupName: groupName,
            container: container,
            template: template,
            namePattern: namePattern,
            rows: existingRows,
            addButton: addButton
        };
        // Store the group
        activeGroups.set(groupName, group);
        // Attach add button listener
        if (addButton) {
            // Remove any existing listeners
            addButton.removeEventListener('click', handleAddRow);
            addButton.addEventListener('click', handleAddRow);
        }
        // Reindex existing rows
        reindexRows(group);
        // Update summaries
        updateSummaries(group);
    }
    function handleAddRow(event) {
        event.preventDefault();
        var button = event.target;
        var container = button.closest('[data-cd-repeat-group]');
        if (!container)
            return;
        var groupName = container.getAttribute('data-cd-repeat-group');
        if (!groupName)
            return;
        var group = activeGroups.get(groupName);
        if (!group)
            return;
        addNewRow(group);
    }
    function addNewRow(group) {
        // Clone the template
        var newRow = group.template.cloneNode(true);
        // Mark as row instead of template
        newRow.removeAttribute('data-cd-repeat-template');
        newRow.setAttribute('data-cd-repeat-row', '');
        // Insert before the template
        group.container.insertBefore(newRow, group.template);
        // Add to rows array
        group.rows.push(newRow);
        // Reindex all rows
        reindexRows(group);
        // Update summaries
        updateSummaries(group);
        // Dispatch event
        newRow.dispatchEvent(new CustomEvent('cd:row:added', {
            bubbles: true,
            detail: { groupName: group.groupName, rowIndex: group.rows.length - 1 }
        }));
    }
    function reindexRows(group) {
        group.rows.forEach(function (row, index) {
            var rowIndex = index + 1; // 1-based indexing
            // Update input names
            var inputs = row.querySelectorAll('[data-repeat-name]');
            inputs.forEach(function (input) {
                var fieldName = input.getAttribute('data-repeat-name');
                if (fieldName) {
                    var finalName = group.namePattern
                        .replace('{i}', rowIndex.toString())
                        .replace('{field}', fieldName);
                    input.name = finalName;
                }
            });
            // Update IDs and labels if present
            var elementsWithIds = row.querySelectorAll('[id]');
            elementsWithIds.forEach(function (element) {
                var originalId = element.getAttribute('data-original-id');
                if (originalId) {
                    element.id = "".concat(originalId, "-").concat(rowIndex);
                }
                else if (!element.id.endsWith("-".concat(rowIndex))) {
                    element.setAttribute('data-original-id', element.id);
                    element.id = "".concat(element.id, "-").concat(rowIndex);
                }
            });
            var labels = row.querySelectorAll('label[for]');
            labels.forEach(function (label) {
                var originalFor = label.getAttribute('data-original-for');
                if (originalFor) {
                    label.htmlFor = "".concat(originalFor, "-").concat(rowIndex);
                }
                else {
                    var currentFor = label.htmlFor;
                    if (!currentFor.endsWith("-".concat(rowIndex))) {
                        label.setAttribute('data-original-for', currentFor);
                        label.htmlFor = "".concat(currentFor, "-").concat(rowIndex);
                    }
                }
            });
        });
        // Dispatch synthetic input events to trigger summary updates
        group.rows.forEach(function (row) {
            var inputs = row.querySelectorAll('input, select, textarea');
            inputs.forEach(function (input) {
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });
    }
    function updateSummaries(group) {
        var _a;
        // Find summary containers for this group
        var summaryContainers = document.querySelectorAll("[data-summary-for=\"".concat(group.groupName, "\"]"));
        summaryContainers.forEach(function (summaryContainer) {
            var template = summaryContainer.querySelector('[data-summary-template]');
            if (!template)
                return;
            // Remove existing summary rows
            var existingSummaryRows = summaryContainer.querySelectorAll('[data-summary-row]');
            existingSummaryRows.forEach(function (row) { return row.remove(); });
            // Create summary rows for each data row
            group.rows.forEach(function (dataRow, index) {
                var rowIndex = index + 1;
                var summaryRow = template.cloneNode(true);
                // Mark as summary row instead of template
                summaryRow.removeAttribute('data-summary-template');
                summaryRow.setAttribute('data-summary-row', '');
                // Update data-input-field attributes
                var fieldElements = summaryRow.querySelectorAll('[data-input-field]');
                fieldElements.forEach(function (element) {
                    var fieldPattern = element.getAttribute('data-input-field');
                    if (fieldPattern) {
                        var finalFieldName = fieldPattern.replace('{i}', rowIndex.toString());
                        element.setAttribute('data-input-field', finalFieldName);
                    }
                });
                // Insert the summary row
                summaryContainer.appendChild(summaryRow);
            });
        });
        // Trigger TryFormly refresh if available
        if (typeof ((_a = window.TryFormly) === null || _a === void 0 ? void 0 : _a.refresh) === 'function') {
            window.TryFormly.refresh();
        }
    }
    // Export function for reinitializing when containers become visible
    function reinitializeDynamicRowGroup(groupName, container) {
        initializeDynamicRowGroup(groupName, container);
    }
    // Listen for visibility events to reinitialize hidden groups
    document.addEventListener('form-wrapper-visibility:shown', function (event) {
        var visibleContainer = event.target;
        var repeaterGroups = visibleContainer.querySelectorAll('[data-cd-repeat-group]');
        repeaterGroups.forEach(function (group) {
            var groupName = group.getAttribute('data-cd-repeat-group');
            if (groupName) {
                reinitializeDynamicRowGroup(groupName, group);
            }
        });
    });
    function initializeLibrary() {
        var forms = document.querySelectorAll('form[data-cd-form="true"]');
        forms.forEach(function (form) {
            var formElement = form;
            try {
                // Initialize input formatting for inputs with data-input attribute
                initInputFormatting(formElement);
                // Initialize form wrapper visibility for elements with data-show-when
                initFormWrapperVisibility();
                // Initialize dynamic rows for repeatable sections
                initDynamicRows();
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
