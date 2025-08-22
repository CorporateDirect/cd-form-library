// CD Form Library - Browser Version
// Simple IIFE for direct browser use without module dependencies

(function() {
    'use strict';
    
    const VERSION = '0.1.39';
    
    console.log('🚀 CD Form Library Browser v' + VERSION + ' loading...');
    
    function parseFormat(attr) {
        console.log('🔧 parseFormat called with attr:', JSON.stringify(attr));
        const normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
        console.log('🔧 normalized attr:', JSON.stringify(normalized));
        
        if (normalized === 'date:mmddyyyy') {
            console.log('🔧 Matched date:mmddyyyy');
            return { type: 'date', pattern: 'mmddyyyy' };
        }
        if (normalized === 'date:ddmmyyyy') {
            console.log('🔧 Matched date:ddmmyyyy');
            return { type: 'date', pattern: 'ddmmyyyy' };
        }
        if (normalized === 'time:hhmm am' || normalized === 'time:hhmm') {
            console.log('🔧 Matched time:hhmm am');
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
        }
        if (normalized === 'time:hhmm pm') {
            console.log('🔧 Matched time:hhmm pm');
            return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
        }
        if (normalized === 'percent') {
            console.log('🔧 Matched percent');
            return { type: 'percent', pattern: 'percent' };
        }
        
        console.log('🔧 No format match found for:', JSON.stringify(normalized));
        return null;
    }
    
    function createSimpleMask(config) {
        // Simple masking without Maskito for now - just for testing
        console.log('🔧 Creating simple mask for config:', config);
        
        if (config.type === 'date') {
            return {
                apply: function(input) {
                    input.addEventListener('input', function() {
                        let value = this.value.replace(/\D/g, ''); // Remove non-digits
                        if (value.length >= 2) {
                            value = value.substring(0,2) + '/' + value.substring(2);
                        }
                        if (value.length >= 5) {
                            value = value.substring(0,5) + '/' + value.substring(5,9);
                        }
                        this.value = value;
                    });
                }
            };
        } else if (config.type === 'time') {
            return {
                apply: function(input) {
                    input.addEventListener('input', function() {
                        let value = this.value.replace(/[^\dAPMap]/g, ''); // Keep digits and AM/PM letters
                        console.log('🔧 Time input value:', value);
                        
                        // Extract digits and letters
                        const digits = value.replace(/[^\d]/g, '');
                        const letters = value.replace(/[\d]/g, '').toUpperCase();
                        
                        let formatted = '';
                        if (digits.length >= 2) {
                            formatted = digits.substring(0,2) + ':' + digits.substring(2,4);
                        } else {
                            formatted = digits;
                        }
                        
                        // Handle AM/PM
                        if (letters.includes('P') || letters.includes('PM')) {
                            formatted += ' PM';
                        } else if (formatted.length >= 4) {
                            formatted += ' AM';
                        }
                        
                        this.value = formatted;
                        console.log('🔧 Formatted time:', formatted);
                    });
                }
            };
        } else if (config.type === 'percent') {
            return {
                apply: function(input) {
                    input.addEventListener('input', function() {
                        let value = this.value.replace(/[^\d.]/g, ''); // Keep only digits and decimal
                        console.log('🔧 Percent input value:', value);
                        
                        // Prevent multiple decimals
                        const parts = value.split('.');
                        if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        
                        // Add % symbol if there are digits
                        if (value && !this.value.endsWith('%')) {
                            value += '%';
                        }
                        
                        this.value = value;
                        console.log('🔧 Formatted percent:', value);
                    });
                    
                    // Handle backspace to remove % if needed
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Backspace' && this.value.endsWith('%') && this.value.length === 1) {
                            this.value = '';
                        }
                    });
                }
            };
        }
        return null;
    }
    
    function initInputFormatting(form) {
        console.log('🔧 initInputFormatting called for form:', form);
        const inputs = form.querySelectorAll('input[data-input]');
        console.log('🔧 Found ' + inputs.length + ' inputs with data-input attribute');
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const attr = input.getAttribute('data-input');
            console.log('🔧 Input ' + (i + 1) + ':', input, 'data-input value:', attr);
            
            if (!attr) {
                console.log('🔧 Input ' + (i + 1) + ' has no data-input attribute, skipping');
                continue;
            }

            const config = parseFormat(attr);
            console.log('🔧 Input ' + (i + 1) + ' parsed config:', config);
            if (!config) {
                console.log('🔧 Input ' + (i + 1) + ' config parsing failed for attr:', attr);
                continue;
            }

            const mask = createSimpleMask(config);
            console.log('🔧 Input ' + (i + 1) + ' mask created:', mask);
            if (!mask) {
                console.log('🔧 Input ' + (i + 1) + ' failed to create mask');
                continue;
            }
            
            // Apply the mask
            console.log('🔧 Input ' + (i + 1) + ' applying mask...');
            mask.apply(input);
            
            // Dispatch bound event
            input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
            console.log('🔧 Input ' + (i + 1) + ' bound event dispatched');
        }
    }
    
    function initFormWrapperVisibility() {
        console.log('🔧 initFormWrapperVisibility called');
        
        const wrappers = document.querySelectorAll('[data-show-when]');
        console.log('🔧 Found ' + wrappers.length + ' wrappers with data-show-when');
        
        // Track all input groups that wrappers are listening to
        const groupListeners = new Map();
        
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const condition = wrapper.getAttribute('data-show-when');
            console.log('🔧 Wrapper ' + (i + 1) + ' condition:', condition);
            
            if (!condition) continue;
            
            const equalPos = condition.indexOf('=');
            if (equalPos === -1) {
                console.log('🔧 Invalid condition format (no =):', condition);
                continue;
            }
            
            const group = condition.substring(0, equalPos).trim();
            const value = condition.substring(equalPos + 1).trim();
            
            console.log('🔧 Parsed - group:', group, 'value:', value);
            
            // Track this wrapper as listening to this group
            if (!groupListeners.has(group)) {
                groupListeners.set(group, []);
            }
            groupListeners.get(group).push({ wrapper: wrapper, targetValue: value });
            
            // Set initial visibility
            updateWrapperVisibility(wrapper, group, value);
        }
        
        console.log('🔧 Group listeners setup for', groupListeners.size, 'groups');
        
        // Attach event listeners to input groups
        groupListeners.forEach(function(wrapperList, group) {
            console.log('🔧 Setting up listeners for group:', group);
            
            const inputs = document.querySelectorAll('input[name="' + group + '"], select[name="' + group + '"], textarea[name="' + group + '"]');
            console.log('🔧 Found ' + inputs.length + ' inputs for group:', group);
            
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                input.addEventListener('change', function() {
                    console.log('🔧 Input changed for group:', group, 'new value:', this.value);
                    
                    wrapperList.forEach(function(item) {
                        updateWrapperVisibility(item.wrapper, group, item.targetValue);
                    });
                });
            }
        });
        
        console.log('🔧 Wrapper visibility initialization complete');
    }
    
    function updateWrapperVisibility(wrapper, group, targetValue) {
        const inputs = document.querySelectorAll('input[name="' + group + '"], select[name="' + group + '"], textarea[name="' + group + '"]');
        let currentValue = '';
        
        // Get current value from inputs
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            
            if (input.type === 'radio' || input.type === 'checkbox') {
                if (input.checked) {
                    currentValue = input.value;
                    break;
                }
            } else {
                currentValue = input.value;
                break;
            }
        }
        
        const shouldShow = currentValue === targetValue;
        console.log('🔧 Updating wrapper visibility - group:', group, 'current:', currentValue, 'target:', targetValue, 'show:', shouldShow);
        
        if (shouldShow) {
            wrapper.style.display = '';
            wrapper.removeAttribute('aria-hidden');
            
            // Make focusable elements accessible again
            const focusableElements = wrapper.querySelectorAll('input, select, textarea, button, [tabindex]');
            for (let i = 0; i < focusableElements.length; i++) {
                focusableElements[i].removeAttribute('tabindex');
            }
            
            // Dispatch shown event
            wrapper.dispatchEvent(new CustomEvent('form-wrapper-visibility:shown', { bubbles: true }));
            console.log('🔧 Wrapper shown for group:', group);
        } else {
            wrapper.style.display = 'none';
            wrapper.setAttribute('aria-hidden', 'true');
            
            // Remove from tab order
            const focusableElements = wrapper.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
            for (let i = 0; i < focusableElements.length; i++) {
                focusableElements[i].setAttribute('tabindex', '-1');
            }
            
            // Dispatch hidden event
            wrapper.dispatchEvent(new CustomEvent('form-wrapper-visibility:hidden', { bubbles: true }));
            console.log('🔧 Wrapper hidden for group:', group);
        }
    }
    
    function initDynamicRows() {
        console.log('🔧 initDynamicRows called');
        
        // Find all row repeater groups using data-repeat-group attribute
        const repeaterGroups = document.querySelectorAll('[data-repeat-group]');
        console.log('🔧 Found ' + repeaterGroups.length + ' repeater groups');
        
        for (let i = 0; i < repeaterGroups.length; i++) {
            const group = repeaterGroups[i];
            const groupName = group.getAttribute('data-repeat-group');
            
            if (!groupName) {
                console.log('🔧 Skipping group without data-repeat-group value');
                continue;
            }
            
            console.log('🔧 Processing repeater group "' + groupName + '"');
            
            // Find all rows within this group using data-repeat-row attribute
            const rows = group.querySelectorAll('[data-repeat-row="' + groupName + '"]');
            console.log('🔧 Found ' + rows.length + ' rows for group "' + groupName + '"');
            
            // Convert NodeList to Array for easier manipulation
            const rowsArray = Array.prototype.slice.call(rows);
            
            // Process each row to set up data-repeat-name attributes
            for (let j = 0; j < rowsArray.length; j++) {
                const row = rowsArray[j];
                const inputs = row.querySelectorAll('input, select, textarea');
                
                console.log('🔧 Processing row ' + (j + 1) + ' with ' + inputs.length + ' inputs');
                
                for (let k = 0; k < inputs.length; k++) {
                    const input = inputs[k];
                    const repeatName = input.getAttribute('data-repeat-name');
                    
                    if (repeatName) {
                        // Generate indexed name using pattern: groupName[index][fieldName]
                        const indexedName = groupName + '[' + j + '][' + repeatName + ']';
                        input.setAttribute('name', indexedName);
                        console.log('🔧 Updated input name: ' + repeatName + ' -> ' + indexedName);
                    }
                }
            }
            
            // Set up add/remove button functionality
            setupRowButtons(groupName, rowsArray, group);
        }
        
        console.log('🔧 Dynamic rows initialization complete');
    }
    
    function setupRowButtons(groupName, wrappers, groupElement) {
        console.log('🔧 Setting up buttons for group "' + groupName + '"');
        
        // Find add and remove buttons using data attributes
        const addButtons = document.querySelectorAll('[data-repeat-add="' + groupName + '"]');
        const removeButtons = document.querySelectorAll('[data-repeat-remove="' + groupName + '"]');
        
        console.log('🔧 Found ' + addButtons.length + ' add buttons and ' + removeButtons.length + ' remove buttons for group "' + groupName + '"');
        
        // Add event listeners to add buttons
        for (let i = 0; i < addButtons.length; i++) {
            const button = addButtons[i];
            button.addEventListener('click', function(e) {
                e.preventDefault();
                addRow(groupName, wrappers, groupElement);
            });
            console.log('🔧 Add button listener attached for group "' + groupName + '"');
        }
        
        // Add event listeners to remove buttons
        for (let i = 0; i < removeButtons.length; i++) {
            const button = removeButtons[i];
            button.addEventListener('click', function(e) {
                e.preventDefault();
                removeRow(groupName, wrappers, this, groupElement);
            });
            console.log('🔧 Remove button listener attached for group "' + groupName + '"');
        }
    }
    
    function addRow(groupName, wrappers, groupElement) {
        console.log('🔧 Adding row to group "' + groupName + '"');
        
        if (wrappers.length === 0) return;
        
        // Get fresh wrappers from DOM to avoid stale references
        console.log('🔧 === DOM QUERY DEBUG ===');
        console.log('🔧 Group element:', groupElement);
        console.log('🔧 Query selector: [data-repeat-row="' + groupName + '"]');
        
        const currentWrappers = groupElement.querySelectorAll('[data-repeat-row="' + groupName + '"]');
        console.log('🔧 Fresh DOM query found ' + currentWrappers.length + ' current rows');
        
        // DEBUG: Compare with passed wrappers array
        console.log('🔧 Passed wrappers array length:', wrappers.length);
        console.log('🔧 DOM query vs passed array match:', currentWrappers.length === wrappers.length);
        
        // DEBUG: Examine all rows in the DOM
        for (let i = 0; i < currentWrappers.length; i++) {
            const wrapper = currentWrappers[i];
            console.log('🔧 DOM Row ' + i + ':', wrapper);
            console.log('🔧   data-repeat-row:', '"' + wrapper.getAttribute('data-repeat-row') + '"');
            const inputs = wrapper.querySelectorAll('input[data-repeat-name]');
            console.log('🔧   inputs found:', inputs.length);
            for (let j = 0; j < inputs.length; j++) {
                console.log('🔧     input[' + j + '] name="' + inputs[j].name + '" value="' + inputs[j].value + '"');
            }
        }
        console.log('🔧 === END DOM QUERY DEBUG ===');
        
        // Store current values from all existing rows before adding new row
        console.log('🔧 Preserving values from existing rows...');
        const preservedValues = [];
        for (let rowIndex = 0; rowIndex < currentWrappers.length; rowIndex++) {
            const wrapper = currentWrappers[rowIndex];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            const rowValues = {};
            
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const repeatName = input.getAttribute('data-repeat-name');
                if (repeatName) {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        rowValues[repeatName] = input.checked;
                    } else {
                        rowValues[repeatName] = input.value;
                    }
                    console.log('🔧 Preserved row ' + rowIndex + ' field "' + repeatName + '" = "' + rowValues[repeatName] + '"');
                }
            }
            preservedValues.push(rowValues);
        }
        
        // Clone the first wrapper as template
        const template = currentWrappers[0];
        const newRow = template.cloneNode(true);
        const newIndex = currentWrappers.length;
        
        // Clear values and update names/IDs in the new row
        const inputs = newRow.querySelectorAll('input, select, textarea');
        const labels = newRow.querySelectorAll('label');
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            
            // Clear the value
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
            
            // Update the name with new index using data-repeat-name
            const repeatName = input.getAttribute('data-repeat-name');
            if (repeatName) {
                const indexedName = groupName + '[' + newIndex + '][' + repeatName + ']';
                input.setAttribute('name', indexedName);
                console.log('🔧 Updated new row input: ' + repeatName + ' -> ' + indexedName);
                
                // Update ID to be unique
                const originalId = input.getAttribute('id');
                if (originalId) {
                    const newId = originalId + '-' + newIndex;
                    input.setAttribute('id', newId);
                    
                    // Find corresponding label and update its 'for' attribute
                    for (let j = 0; j < labels.length; j++) {
                        const label = labels[j];
                        if (label.getAttribute('for') === originalId) {
                            label.setAttribute('for', newId);
                            console.log('🔧 Updated label for: ' + originalId + ' -> ' + newId);
                            break;
                        }
                    }
                }
            }
        }
        
        // Insert the new row after the last existing row
        const lastWrapper = currentWrappers[currentWrappers.length - 1];
        lastWrapper.parentNode.insertBefore(newRow, lastWrapper.nextSibling);
        
        // Add the new wrapper to our tracking array
        wrappers.push(newRow);
        
        // Get updated wrapper list after DOM insertion
        const updatedWrappers = groupElement.querySelectorAll('[data-repeat-row="' + groupName + '"]');
        console.log('🔧 After insertion, found ' + updatedWrappers.length + ' total rows');
        
        // Restore preserved values to existing rows (they may have been cleared during DOM manipulation)
        console.log('🔧 Restoring preserved values to existing rows...');
        for (let rowIndex = 0; rowIndex < preservedValues.length; rowIndex++) {
            const wrapper = updatedWrappers[rowIndex];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            const rowValues = preservedValues[rowIndex];
            
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const repeatName = input.getAttribute('data-repeat-name');
                if (repeatName && rowValues.hasOwnProperty(repeatName)) {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        input.checked = rowValues[repeatName];
                    } else {
                        input.value = rowValues[repeatName];
                    }
                    console.log('🔧 Restored row ' + rowIndex + ' field "' + repeatName + '" = "' + rowValues[repeatName] + '"');
                }
            }
        }
        
        // Initialize input formatting for the new row inputs
        console.log('🔧 Initializing input formatting for new row inputs');
        const newRowInputs = newRow.querySelectorAll('input[data-input]');
        for (let i = 0; i < newRowInputs.length; i++) {
            const input = newRowInputs[i];
            const attr = input.getAttribute('data-input');
            console.log('🔧 New row input with data-input:', attr);
            
            if (!attr) continue;
            
            const config = parseFormat(attr);
            if (!config) continue;
            
            const mask = createSimpleMask(config);
            if (!mask) continue;
            
            // Apply the mask to the new input
            mask.apply(input);
            
            // Dispatch bound event
            input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
            console.log('🔧 Input formatting applied to new row input');
        }
        
        // Initialize remove button for the new row
        console.log('🔧 Initializing remove button for new row');
        const newRemoveButtons = newRow.querySelectorAll('[data-repeat-remove="' + groupName + '"]');
        for (let i = 0; i < newRemoveButtons.length; i++) {
            const button = newRemoveButtons[i];
            button.addEventListener('click', function(e) {
                e.preventDefault();
                removeRow(groupName, wrappers, this, groupElement);
            });
            console.log('🔧 Remove button listener attached for new row in group "' + groupName + '"');
        }
        
        // Update summary if present using fresh wrapper list
        updateSummaryForGroup(groupName, updatedWrappers);
        
        // Dispatch custom event
        newRow.dispatchEvent(new CustomEvent('dynamic-rows:added', { 
            bubbles: true,
            detail: { groupName: groupName, rowIndex: newIndex }
        }));
        
        console.log('🔧 Row added to group "' + groupName + '", new total: ' + updatedWrappers.length);
    }
    
    function removeRow(groupName, wrappers, clickedButton, groupElement) {
        console.log('🔧 Removing row from group "' + groupName + '"');
        
        if (wrappers.length <= 1) {
            console.log('🔧 Cannot remove last row from group "' + groupName + '"');
            return;
        }
        
        // Find which row contains the clicked button
        let targetRow = null;
        let targetIndex = -1;
        
        for (let i = 0; i < wrappers.length; i++) {
            if (wrappers[i].contains(clickedButton)) {
                targetRow = wrappers[i];
                targetIndex = i;
                break;
            }
        }
        
        if (!targetRow) {
            console.log('🔧 Could not find target row for removal');
            return;
        }
        
        // Remove the row from DOM
        targetRow.parentNode.removeChild(targetRow);
        
        // Remove from tracking array
        wrappers.splice(targetIndex, 1);
        
        // Reindex remaining rows
        for (let i = targetIndex; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            const labels = wrapper.querySelectorAll('label');
            
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                const repeatName = input.getAttribute('data-repeat-name');
                if (repeatName) {
                    const indexedName = groupName + '[' + i + '][' + repeatName + ']';
                    input.setAttribute('name', indexedName);
                    console.log('🔧 Reindexed input: ' + repeatName + ' -> ' + indexedName);
                    
                    // Update ID and corresponding label
                    const currentId = input.getAttribute('id');
                    if (currentId) {
                        // Extract base ID (remove any existing index suffix)
                        const baseId = currentId.replace(/-\d+$/, '');
                        const newId = baseId + '-' + i;
                        input.setAttribute('id', newId);
                        
                        // Find corresponding label and update its 'for' attribute
                        for (let k = 0; k < labels.length; k++) {
                            const label = labels[k];
                            if (label.getAttribute('for') === currentId) {
                                label.setAttribute('for', newId);
                                console.log('🔧 Reindexed label for: ' + currentId + ' -> ' + newId);
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // Update summary if present
        updateSummaryForGroup(groupName, wrappers);
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('dynamic-rows:removed', { 
            bubbles: true,
            detail: { groupName: groupName, removedIndex: targetIndex }
        }));
        
        console.log('🔧 Row removed from group "' + groupName + '", new total: ' + wrappers.length);
    }
    
    function updateSummaryForGroup(groupName, wrappers) {
        console.log('📊 === SUMMARY UPDATE DEBUG START ===');
        console.log('📊 Updating summary for group "' + groupName + '" with ' + wrappers.length + ' data rows');
        
        // DEBUG: Implementation approach analysis
        console.log('📊 === IMPLEMENTATION ANALYSIS ===');
        console.log('📊 Using pure custom summary implementation (no TryFormly integration)');
        console.log('📊 Data attributes in use:');
        console.log('  📊 data-cd-summary-for (our custom)');
        console.log('  📊 data-cd-summary-template (our custom)');
        console.log('  📊 data-cd-input-field (custom implementation)');
        console.log('📊 === END IMPLEMENTATION ANALYSIS ===');
        
        // Find summary container using data-cd-summary-for attribute
        const summaryContainer = document.querySelector('[data-cd-summary-for="' + groupName + '"]');
        if (!summaryContainer) {
            console.log('❌ No summary container found for group "' + groupName + '"');
            return;
        }
        console.log('✅ Found summary container:', summaryContainer);
        
        // Find summary template
        const template = summaryContainer.querySelector('[data-cd-summary-template]');
        if (!template) {
            console.log('❌ No summary template found for group "' + groupName + '"');
            return;
        }
        console.log('✅ Found summary template:', template);
        
        // Ensure template is hidden from display but don't affect cloned rows
        template.style.position = 'absolute';
        template.style.left = '-9999px';
        template.style.top = '-9999px';
        template.setAttribute('aria-hidden', 'true');
        console.log('📊 Template row moved off-screen (but still cloneable)');
        
        // Log current form input values
        console.log('📊 Current form input values:');
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            console.log('📊 Row ' + i + ' inputs:');
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                console.log('  📊 Input name="' + input.name + '" value="' + input.value + '" data-repeat-name="' + input.getAttribute('data-repeat-name') + '"');
            }
        }
        
        // Clear existing summary rows (but keep the template)
        const existingSummaryRows = summaryContainer.querySelectorAll('[data-cd-summary-row]');
        console.log('📊 Removing ' + existingSummaryRows.length + ' existing summary rows');
        for (let i = 0; i < existingSummaryRows.length; i++) {
            existingSummaryRows[i].parentNode.removeChild(existingSummaryRows[i]);
        }
        
        // Generate summary rows for each data row and collect them
        const summaryRowsToInsert = [];
        for (let i = 0; i < wrappers.length; i++) {
            console.log('📊 Generating summary row ' + i);
            const summaryRow = template.cloneNode(true);
            summaryRow.removeAttribute('data-cd-summary-template');
            summaryRow.setAttribute('data-cd-summary-row', 'true');
            
            // Reset any template positioning styles to make cloned row visible
            summaryRow.style.position = '';
            summaryRow.style.left = '';
            summaryRow.style.top = '';
            summaryRow.removeAttribute('aria-hidden');
            
            // Update data-cd-input-field attributes to match row index
            const inputFields = summaryRow.querySelectorAll('[data-cd-input-field]');
            console.log('📊 Processing ' + inputFields.length + ' input fields for row ' + i);
            for (let j = 0; j < inputFields.length; j++) {
                const field = inputFields[j];
                const fieldTemplate = field.getAttribute('data-cd-input-field');
                
                // Replace {i} token with actual index
                const indexedField = fieldTemplate.replace(/\{i\}/g, i);
                field.setAttribute('data-cd-input-field', indexedField);
                
                // Reset any inherited styles from template
                field.style.display = '';
                field.style.visibility = '';
                field.style.opacity = '';
                field.style.position = '';
                field.style.left = '';
                field.style.top = '';
                
                console.log('📊   Field ' + j + ': ' + fieldTemplate + ' → ' + indexedField);
            }
            
            summaryRowsToInsert.push(summaryRow);
        }
        
        // Insert all summary rows in order after the template
        let insertAfter = template;
        for (let i = 0; i < summaryRowsToInsert.length; i++) {
            insertAfter.parentNode.insertBefore(summaryRowsToInsert[i], insertAfter.nextSibling);
            insertAfter = summaryRowsToInsert[i];
        }
        console.log('📊 Inserted ' + summaryRowsToInsert.length + ' summary rows');
        
        // DEBUG: Examine all created summary fields after insertion
        console.log('📊 === POST-INSERTION SUMMARY FIELD DEBUG ===');
        const allInsertedFields = summaryContainer.querySelectorAll('[data-cd-input-field]:not([data-cd-summary-template] [data-cd-input-field])');
        console.log('📊 Found ' + allInsertedFields.length + ' inserted summary fields');
        for (let i = 0; i < allInsertedFields.length; i++) {
            const field = allInsertedFields[i];
            console.log('📊 Field ' + i + ':');
            console.log('  📊 data-cd-input-field: "' + field.getAttribute('data-cd-input-field') + '"');
            console.log('  📊 textContent: "' + field.textContent + '"');
            console.log('  📊 innerHTML: "' + field.innerHTML + '"');
            console.log('  📊 computed display: ' + window.getComputedStyle(field).display);
            console.log('  📊 computed visibility: ' + window.getComputedStyle(field).visibility);
            console.log('  📊 computed opacity: ' + window.getComputedStyle(field).opacity);
            console.log('  📊 element classes: "' + field.className + '"');
            console.log('  📊 parent element: ', field.parentNode);
            console.log('  📊 offsetHeight: ' + field.offsetHeight);
            console.log('  📊 offsetWidth: ' + field.offsetWidth);
        }
        
        
        // Dispatch input events on all form inputs to trigger TryFormly updates
        console.log('📊 Dispatching input events to trigger TryFormly...');
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                console.log('📊 Dispatching input event for: ' + input.name + ' (value: "' + input.value + '")');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Manual summary population as fallback when TryFormly is not available
        console.log('📊 Manually populating summary fields as fallback...');
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                const inputName = input.getAttribute('name');
                const inputValue = input.value;
                
                if (inputName && inputValue) {
                    // Find corresponding summary field
                    const summaryField = summaryContainer.querySelector('[data-cd-input-field="' + inputName + '"]');
                    if (summaryField) {
                        // Debug current field state
                        console.log('📊 DEBUG: Before update - field:', summaryField);
                        console.log('📊 DEBUG: Current textContent:', '"' + summaryField.textContent + '"');
                        console.log('📊 DEBUG: Current innerHTML:', '"' + summaryField.innerHTML + '"');
                        console.log('📊 DEBUG: Current style.display:', '"' + summaryField.style.display + '"');
                        console.log('📊 DEBUG: Current style.visibility:', '"' + summaryField.style.visibility + '"');
                        console.log('📊 DEBUG: Computed display:', window.getComputedStyle(summaryField).display);
                        console.log('📊 DEBUG: Computed visibility:', window.getComputedStyle(summaryField).visibility);
                        
                        // Try multiple methods to set content
                        summaryField.textContent = inputValue;
                        summaryField.innerHTML = inputValue;
                        summaryField.innerText = inputValue;
                        
                        // Try multiple methods to ensure visibility and force CSS rendering
                        summaryField.style.display = 'block !important';
                        summaryField.style.visibility = 'visible !important';
                        summaryField.style.opacity = '1 !important';
                        summaryField.style.height = 'auto !important';
                        summaryField.style.width = 'auto !important';
                        summaryField.style.minHeight = '1em !important';
                        summaryField.style.minWidth = '1ch !important';
                        summaryField.removeAttribute('hidden');
                        
                        // Debug after update
                        console.log('📊 DEBUG: After update - textContent:', '"' + summaryField.textContent + '"');
                        console.log('📊 DEBUG: After update - innerHTML:', '"' + summaryField.innerHTML + '"');
                        console.log('📊 DEBUG: After update - style.display:', '"' + summaryField.style.display + '"');
                        
                        console.log('📊 Manual summary update: ' + inputName + ' = "' + inputValue + '"');
                    } else {
                        console.log('📊 WARNING: No summary field found for input name: ' + inputName);
                        // Debug available summary fields
                        const allSummaryFields = summaryContainer.querySelectorAll('[data-cd-input-field]');
                        console.log('📊 DEBUG: Available summary fields:');
                        for (let k = 0; k < allSummaryFields.length; k++) {
                            console.log('  📊 Field ' + k + ': data-cd-input-field="' + allSummaryFields[k].getAttribute('data-cd-input-field') + '"');
                        }
                    }
                }
            }
        }
        
        console.log('📊 Summary updated for group "' + groupName + '" with ' + wrappers.length + ' rows');
        
        // Pure custom implementation - no external refresh needed
        
        console.log('📊 === SUMMARY UPDATE DEBUG END ===');
    }
    
    function initializeLibrary() {
        console.log('🚀 CD Form Library v' + VERSION + ' initializing...');
        console.log('🚀 Document ready state:', document.readyState);
        
        const forms = document.querySelectorAll('form[data-cd-form="true"]');
        console.log('🚀 Found ' + forms.length + ' forms with data-cd-form="true"');
        
        if (forms.length === 0) {
            console.log('🚀 No CD forms found, checking all forms on page...');
            const allForms = document.querySelectorAll('form');
            console.log('🚀 Total forms on page: ' + allForms.length);
            for (let i = 0; i < allForms.length; i++) {
                console.log('🚀 Form ' + (i + 1) + ':', allForms[i], 'data-cd-form:', allForms[i].getAttribute('data-cd-form'));
            }
        }
        
        for (let i = 0; i < forms.length; i++) {
            const form = forms[i];
            console.log('🚀 Processing form ' + (i + 1) + ':', form);
            
            try {
                // Initialize input formatting for inputs with data-input attribute
                initInputFormatting(form);
                
                // Initialize form wrapper visibility for elements with data-show-when
                initFormWrapperVisibility();
                
                // Initialize dynamic rows functionality
                initDynamicRows();
                
                // Dispatch custom event for form enhancement completion
                form.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
                console.log('🚀 Form ' + (i + 1) + ' enhanced successfully');
            } catch (error) {
                console.error('🚀 Error enhancing form ' + (i + 1) + ':', error);
            }
        }
        
        console.log('🚀 Library initialization complete - enhanced ' + forms.length + ' forms');
    }
    
    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLibrary);
    } else {
        initializeLibrary();
    }
    
    // Global exposure for browser environments
    window.CDFormLibrary = {
        version: VERSION,
        initialize: initializeLibrary
    };
    
    console.log('🚀 CDFormLibrary exposed on window object');
})();