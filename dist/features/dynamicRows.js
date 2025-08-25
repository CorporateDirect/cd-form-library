// Dynamic Rows feature module
// Manages repeatable form sections based on data-cd-repeat-group attribute
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
    exports.initDynamicRows = initDynamicRows;
    exports.initializeDynamicRowGroup = initializeDynamicRowGroup;
    exports.reinitializeDynamicRowGroup = reinitializeDynamicRowGroup;
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
});
