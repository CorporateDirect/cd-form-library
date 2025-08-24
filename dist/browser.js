// CD Form Library - Browser Version
// Simple IIFE for direct browser use without module dependencies

(function() {
    'use strict';
    
  const VERSION = '0.1.61';
    
    console.log('🚀 CD Form Library Browser v' + VERSION + ' loading...');
    
    // Debounce utility to prevent excessive function calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction() {
            const later = function() {
                clearTimeout(timeout);
                func.apply(this, arguments);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
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
                        
                        // Add % symbol if there are digits and it doesn't already have one
                        if (value && !value.endsWith('%')) {
                            value += '%';
                        }
                        
                        this.value = value;
                        console.log('🔧 Formatted percent:', value);
                    });
                    
                    // Handle backspace to remove % if needed
                    input.addEventListener('keydown', function(e) {
                        if (e.key === 'Backspace' && this.value === '%') {
                            e.preventDefault();
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
        
        // Find all row repeater groups using data-cd-repeat-group attribute
        const repeaterGroups = document.querySelectorAll('[data-cd-repeat-group]');
        console.log('🔧 Found ' + repeaterGroups.length + ' repeater groups');
        
        // Log all discovered group names for branch isolation verification
        console.log('🔧 === BRANCH ISOLATION CHECK ===');
        for (let i = 0; i < repeaterGroups.length; i++) {
            const group = repeaterGroups[i];
            const groupName = group.getAttribute('data-cd-repeat-group');
            console.log('🔧 Group ' + (i + 1) + ': "' + groupName + '" (visible: ' + (window.getComputedStyle(group).display !== 'none') + ')');
        }
        console.log('🔧 === END BRANCH ISOLATION CHECK ===');
        
        for (let i = 0; i < repeaterGroups.length; i++) {
            const group = repeaterGroups[i];
            const groupName = group.getAttribute('data-cd-repeat-group');
            
            if (!groupName) {
                console.log('🔧 Skipping group without data-cd-repeat-group value');
                continue;
            }
            
            // Enhanced debugging for multiple groups with same name
            console.log('🔧 === REPEATER GROUP DEBUG ===');
            console.log('🔧 Processing repeater group "' + groupName + '" (' + (i + 1) + '/' + repeaterGroups.length + ')');
            console.log('🔧 Group element:', group);
            
            // Check visibility using CSS properties instead of dimensions
            const computedStyle = window.getComputedStyle(group);
            const groupRect = group.getBoundingClientRect();
            
            // Consider visible if CSS properties indicate visibility (ignore zero dimensions at init time)
            const isVisible = computedStyle.display !== 'none' && 
                             computedStyle.visibility !== 'hidden' && 
                             parseFloat(computedStyle.opacity) > 0;
            
            console.log('🔧 Group visibility check:');
            console.log('  🔧 Display:', computedStyle.display);
            console.log('  🔧 Visibility:', computedStyle.visibility);
            console.log('  🔧 Opacity:', computedStyle.opacity);
            console.log('  🔧 BoundingRect:', groupRect.width + 'x' + groupRect.height);
            console.log('  🔧 Is visible (CSS-based):', isVisible);
            
            // Check parent wrapper visibility using CSS properties
            let parentWrapper = group.closest('[data-show-when]');
            if (parentWrapper) {
                const parentStyle = window.getComputedStyle(parentWrapper);
                const parentRect = parentWrapper.getBoundingClientRect();
                const parentVisible = parentStyle.display !== 'none' && 
                                    parentStyle.visibility !== 'hidden' && 
                                    parseFloat(parentStyle.opacity) > 0;
                
                console.log('🔧 Parent wrapper with data-show-when found:');
                console.log('  🔧 data-show-when:', parentWrapper.getAttribute('data-show-when'));
                console.log('  🔧 Parent display:', parentStyle.display);
                console.log('  🔧 Parent visibility:', parentStyle.visibility);
                console.log('  🔧 Parent opacity:', parentStyle.opacity);
                console.log('  🔧 Parent BoundingRect:', parentRect.width + 'x' + parentRect.height);
                console.log('  🔧 Parent visible (CSS-based):', parentVisible);
                
                if (!parentVisible) {
                    console.log('🔧 ⚠️ SKIPPING hidden repeater group "' + groupName + '" (parent hidden)');
                    continue;
                }
            }
            
            if (!isVisible) {
                console.log('🔧 ⚠️ SKIPPING invisible repeater group "' + groupName + '" (CSS hidden)');
                continue;
            }
            
            console.log('🔧 ✅ Processing visible repeater group "' + groupName + '"');
            
            // Find all rows within this group using data-cd-repeat-row attribute
            const rows = group.querySelectorAll('[data-cd-repeat-row="' + groupName + '"]');
            console.log('🔧 Found ' + rows.length + ' rows for group "' + groupName + '"');
            
            // Convert NodeList to Array for easier manipulation
            const rowsArray = Array.prototype.slice.call(rows);
            
            // Process each row to set up indexed naming for dynamic arrays
            for (let j = 0; j < rowsArray.length; j++) {
                const row = rowsArray[j];
                const inputs = row.querySelectorAll('input, select, textarea');
                
                console.log('🔧 Processing row ' + (j + 1) + ' with ' + inputs.length + ' inputs');
                
                for (let k = 0; k < inputs.length; k++) {
                    const input = inputs[k];
                    let repeatName = input.getAttribute('data-repeat-name');
                    const currentName = input.getAttribute('name');
                    
                    // If no data-repeat-name, generate one from the current name
                    if (!repeatName && currentName) {
                        // Map common field names to data-repeat-name format
                        const nameMapping = {
                            'Name-of-Person-Entity': 'person_entity_name',
                            'Current-Ownership': 'current_ownership', 
                            'New-Ownership': 'new_ownership'
                        };
                        
                        repeatName = nameMapping[currentName] || currentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        input.setAttribute('data-repeat-name', repeatName);
                        console.log('🔧 Generated data-repeat-name for ' + currentName + ': ' + repeatName);
                    }
                    
                    if (repeatName) {
                        // Generate indexed name using pattern: groupName[index][fieldName]
                        const indexedName = groupName + '[' + j + '][' + repeatName + ']';
                        input.setAttribute('name', indexedName);
                        console.log('🔧 Set indexed input name: ' + indexedName);
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
        const addButtons = document.querySelectorAll('[data-cd-repeat-add="' + groupName + '"]');
        const removeButtons = document.querySelectorAll('[data-cd-repeat-remove="' + groupName + '"]');
        
        console.log('🔧 Found ' + addButtons.length + ' add buttons and ' + removeButtons.length + ' remove buttons for group "' + groupName + '"');
        
        // Log button attribute verification for branch isolation
        console.log('🔧 === BUTTON ISOLATION CHECK FOR "' + groupName + '" ===');
        for (let i = 0; i < addButtons.length; i++) {
            console.log('🔧 Add button ' + i + ' data-cd-repeat-add: "' + addButtons[i].getAttribute('data-cd-repeat-add') + '"');
        }
        for (let i = 0; i < removeButtons.length; i++) {
            console.log('🔧 Remove button ' + i + ' data-cd-repeat-remove: "' + removeButtons[i].getAttribute('data-cd-repeat-remove') + '"');
        }
        console.log('🔧 === END BUTTON ISOLATION CHECK ===');
        
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
        
        // Add blur event listeners to existing inputs for summary updates
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                if (!input.__cdSummaryBlurAdded) {
                    input.__cdSummaryBlurAdded = true;
                    input.addEventListener('blur', function() {
                        // Update summary when user finishes editing (blur)
                        setTimeout(function() {
                            const currentWrappers = groupElement.querySelectorAll('[data-cd-repeat-row="' + groupName + '"]');
                            updateSummaryForGroup(groupName, currentWrappers);
                        }, 100);
                    });
                }
            }
        }
    }
    
    function addRow(groupName, wrappers, groupElement) {
        console.log('🔧 Adding row to group "' + groupName + '"');
        
        if (wrappers.length === 0) return;
        
        // Get fresh wrappers from DOM to avoid stale references
        // Use setTimeout to ensure DOM has fully updated before querying
        setTimeout(function() {
            console.log('🔧 === DOM QUERY DEBUG (after DOM settle) ===');
            console.log('🔧 Group element:', groupElement);
            console.log('🔧 Query selector: [data-cd-repeat-row="' + groupName + '"]');
            
            const currentWrappers = groupElement.querySelectorAll('[data-cd-repeat-row="' + groupName + '"]');
            console.log('🔧 Fresh DOM query found ' + currentWrappers.length + ' current rows');
            
            // DEBUG: Compare with passed wrappers array
            console.log('🔧 Passed wrappers array length:', wrappers.length);
            console.log('🔧 DOM query vs passed array match:', currentWrappers.length === wrappers.length);
            
            // Continue with the actual add row logic
            continueAddRow(groupName, currentWrappers, groupElement, wrappers);
        }, 10);
    }
    
    function continueAddRow(groupName, currentWrappers, groupElement, wrappers) {
        console.log('🔧 === CONTINUING ADD ROW LOGIC ===');
        
        // DEBUG: Examine all rows in the DOM
        for (let i = 0; i < currentWrappers.length; i++) {
            const wrapper = currentWrappers[i];
            console.log('🔧 DOM Row ' + i + ':', wrapper);
            console.log('🔧   data-cd-repeat-row:', '"' + wrapper.getAttribute('data-cd-repeat-row') + '"');
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
            let repeatName = input.getAttribute('data-repeat-name');
            
            // If no data-repeat-name, generate one from the current name
            if (!repeatName) {
                const currentName = input.getAttribute('name');
                if (currentName) {
                    // Map common field names to data-repeat-name format
                    const nameMapping = {
                        'Name-of-Person-Entity': 'person_entity_name',
                        'Current-Ownership': 'current_ownership', 
                        'New-Ownership': 'new_ownership'
                    };
                    
                    repeatName = nameMapping[currentName] || currentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    input.setAttribute('data-repeat-name', repeatName);
                    console.log('🔧 Generated data-repeat-name for new row: ' + currentName + ' -> ' + repeatName);
                }
            }
            
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
        const updatedWrappers = groupElement.querySelectorAll('[data-cd-repeat-row="' + groupName + '"]');
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
        
        // Add blur event listeners to update summary when user finishes editing a field
        const allNewRowInputs = newRow.querySelectorAll('input, select, textarea');
        for (let i = 0; i < allNewRowInputs.length; i++) {
            const input = allNewRowInputs[i];
            if (!input.__cdSummaryBlurAdded) {
                input.__cdSummaryBlurAdded = true;
                input.addEventListener('blur', function() {
                    // Update summary when user finishes editing (blur)
                    setTimeout(function() {
                        const currentWrappers = groupElement.querySelectorAll('[data-cd-repeat-row="' + groupName + '"]');
                        updateSummaryForGroup(groupName, currentWrappers);
                    }, 100);
                });
            }
        }
        
        // Initialize remove button for the new row
        console.log('🔧 Initializing remove button for new row');
        const newRemoveButtons = newRow.querySelectorAll('[data-cd-repeat-remove="' + groupName + '"]');
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
        
        // CRITICAL: Immediately capture all current input values before ANY other processing
        const currentInputValues = [];
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const inputs = wrapper.querySelectorAll('input, select, textarea');
            const rowValues = {};
            
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                const name = input.name || input.getAttribute('data-repeat-name') || ('field_' + j);
                rowValues[name] = input.value;
            }
            currentInputValues.push(rowValues);
        }
        console.log('📊 CAPTURED INPUT VALUES:', currentInputValues);
        
        // DEBUG: Implementation approach analysis
        console.log('📊 === IMPLEMENTATION ANALYSIS ===');
        console.log('📊 Using pure custom summary implementation (no TryFormly integration)');
        console.log('📊 Data attributes in use:');
        console.log('  📊 data-cd-summary-for (our custom)');
        console.log('  📊 data-cd-summary-template (our custom)');
        console.log('  📊 data-cd-input-field (custom implementation)');
        console.log('📊 === END IMPLEMENTATION ANALYSIS ===');
        
        // Find summary container using data-cd-summary-for attribute
        console.log('🔍 === SUMMARY CONTAINER ISOLATION CHECK ===');
        console.log('🔍 Looking for summary container with data-cd-summary-for="' + groupName + '"');
        
        const allSummaryContainers = document.querySelectorAll('[data-cd-summary-for]');
        console.log('🔍 Found ' + allSummaryContainers.length + ' total summary containers:');
        for (let i = 0; i < allSummaryContainers.length; i++) {
            const container = allSummaryContainers[i];
            const containerGroupName = container.getAttribute('data-cd-summary-for');
            const isMatch = containerGroupName === groupName;
            const isVisible = window.getComputedStyle(container).display !== 'none';
            console.log('🔍   Container ' + i + ': data-cd-summary-for="' + containerGroupName + '" (match: ' + isMatch + ', visible: ' + isVisible + ')');
        }
        console.log('🔍 === END SUMMARY CONTAINER ISOLATION CHECK ===');
        
        const summaryContainer = document.querySelector('[data-cd-summary-for="' + groupName + '"]');
        if (!summaryContainer) {
            console.log('❌ No summary container found for group "' + groupName + '"');
            return;
        }
        console.log('✅ Found summary container for "' + groupName + '":', summaryContainer);
        
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
            
            // Update data-cd-input-field attributes to match indexed input names
            const inputFields = summaryRow.querySelectorAll('[data-cd-input-field]');
            console.log('📊 Processing ' + inputFields.length + ' input fields for row ' + i);
            for (let j = 0; j < inputFields.length; j++) {
                const field = inputFields[j];
                const fieldTemplate = field.getAttribute('data-cd-input-field');
                
                // Replace {i} token with actual index to match input names
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
        
        // Manual summary population using captured values (prevents DOM timing issues)
        console.log('📊 Manually populating summary fields using captured values...');
        for (let i = 0; i < wrappers.length; i++) {
            const wrapper = wrappers[i];
            const capturedRowValues = currentInputValues[i] || {};
            
            console.log('📊 WRAPPER ' + i + ' USING CAPTURED VALUES:', capturedRowValues);
            
            // Use captured values instead of reading from DOM
            for (const inputName in capturedRowValues) {
                const inputValue = capturedRowValues[inputName];
                console.log('  📊 Processing: name="' + inputName + '", value="' + inputValue + '"');
                
                if (inputName && inputValue) {
                    // Find corresponding summary field with exact attribute selector
                    const summaryField = summaryContainer.querySelector('[data-cd-input-field="' + inputName + '"]');
                    console.log('📊 Looking for summary field with data-cd-input-field="' + inputName + '"');
                    console.log('📊 Found summary field:', summaryField);
                    
                    if (summaryField) {
                        // Debug current field state
                        console.log('📊 DEBUG: Before update - field:', summaryField);
                        console.log('📊 DEBUG: Current textContent:', '"' + summaryField.textContent + '"');
                        console.log('📊 DEBUG: Current innerHTML:', '"' + summaryField.innerHTML + '"');
                        console.log('📊 DEBUG: Current style.display:', '"' + summaryField.style.display + '"');
                        console.log('📊 DEBUG: Current style.visibility:', '"' + summaryField.style.visibility + '"');
                        console.log('📊 DEBUG: Computed display:', window.getComputedStyle(summaryField).display);
                        console.log('📊 DEBUG: Computed visibility:', window.getComputedStyle(summaryField).visibility);
                        
                        // Replace [Value] placeholder with actual value
                        const displayValue = inputValue || '';
                        console.log('📊 DEBUG: Setting value "' + displayValue + '" (replacing any [Value] placeholder)');
                        
                        // Clear existing content and set new value
                        summaryField.innerHTML = '';
                        summaryField.textContent = displayValue;
                        summaryField.innerText = displayValue;
                        
                        // Try multiple methods to ensure visibility and force CSS rendering
                        summaryField.style.display = 'block !important';
                        summaryField.style.visibility = 'visible !important';
                        summaryField.style.opacity = '1 !important';
                        summaryField.style.height = 'auto !important';
                        summaryField.style.width = 'auto !important';
                        summaryField.style.minHeight = '1em !important';
                        summaryField.style.minWidth = '1ch !important';
                        summaryField.removeAttribute('hidden');
                        
                        // Debug after update - DOM vs Visual comparison
                        console.log('📊 DEBUG: After update - textContent:', '"' + summaryField.textContent + '"');
                        console.log('📊 DEBUG: After update - innerHTML:', '"' + summaryField.innerHTML + '"');
                        console.log('📊 DEBUG: After update - style.display:', '"' + summaryField.style.display + '"');
                        
                        // DIAGNOSTIC: Check what's actually visible vs what we set
                        setTimeout(function() {
                            console.log('🔍 DIAGNOSTIC CHECK (100ms later):');
                            console.log('🔍   Field selector: [data-cd-input-field="' + inputName + '"]');
                            console.log('🔍   DOM textContent now: "' + summaryField.textContent + '"');
                            console.log('🔍   DOM innerHTML now: "' + summaryField.innerHTML + '"');
                            console.log('🔍   DOM innerText now: "' + summaryField.innerText + '"');
                            console.log('🔍   Visual offsetHeight: ' + summaryField.offsetHeight);
                            console.log('🔍   Visual offsetWidth: ' + summaryField.offsetWidth);
                            console.log('🔍   Computed display: ' + window.getComputedStyle(summaryField).display);
                            console.log('🔍   Computed visibility: ' + window.getComputedStyle(summaryField).visibility);
                            console.log('🔍   Computed opacity: ' + window.getComputedStyle(summaryField).opacity);
                            console.log('🔍   Parent element: ', summaryField.parentElement);
                            console.log('🔍   All classes: "' + summaryField.className + '"');
                        }, 100);
                        
                        console.log('📊 Manual summary update: ' + inputName + ' = "' + inputValue + '"');
                    } else {
                        console.log('📊 WARNING: No summary field found for input name: ' + inputName);
                        // Debug available summary fields
                        const allSummaryFields = summaryContainer.querySelectorAll('[data-cd-input-field]');
                        console.log('📊 DEBUG: Available summary fields (' + allSummaryFields.length + ' total):');
                        for (let k = 0; k < allSummaryFields.length; k++) {
                            const fieldAttr = allSummaryFields[k].getAttribute('data-cd-input-field');
                            const isMatch = fieldAttr === inputName;
                            console.log('  📊 Field ' + k + ': data-cd-input-field="' + fieldAttr + '" (match: ' + isMatch + ')');
                        }
                    }
                }
            }
        }
        
        console.log('📊 Summary updated for group "' + groupName + '" with ' + wrappers.length + ' rows');
        
        // Pure custom implementation - no external refresh needed
        
        console.log('📊 === SUMMARY UPDATE DEBUG END ===');
        
        // Update conditional section visibility after summary update
        manageSummarySectionVisibility();
        
        // Also update static summary fields after dynamic row changes
        updateAllSummaryFields();
    }
    
    function manageSummarySectionVisibility() {
        console.log('👁️ Managing summary section visibility...');
        
        // Find all summary sections with conditional visibility
        const sections = document.querySelectorAll('[data-cd-summary-section]');
        console.log('👁️ Found ' + sections.length + ' conditional summary sections');
        
        sections.forEach(function(section, index) {
            const sectionName = section.getAttribute('data-cd-summary-section');
            const defaultState = section.getAttribute('data-cd-default');
            
            console.log('👁️ Processing section ' + (index + 1) + ': "' + sectionName + '"');
            
            // Check if section has any content
            const hasContent = checkSectionHasContent(section);
            console.log('👁️ Section "' + sectionName + '" has content: ' + hasContent);
            
            // Determine visibility
            let shouldShow = hasContent;
            
            // Apply visibility
            if (shouldShow) {
                showSection(section, sectionName);
            } else if (defaultState === 'hidden' || (defaultState === 'visible' && !hasContent)) {
                hideSection(section, sectionName);
            }
            // If no default specified and no content, preserve existing state
        });
    }
    
    function checkSectionHasContent(section) {
        // Check 1: Any data-cd-input-field elements have non-empty content
        const inputFields = section.querySelectorAll('[data-cd-input-field]');
        for (let i = 0; i < inputFields.length; i++) {
            const field = inputFields[i];
            const content = field.textContent || field.innerText || field.innerHTML;
            if (content && content.trim() && content.trim() !== '[Value]') {
                console.log('👁️ Found content in input field: "' + content.trim() + '"');
                return true;
            }
        }
        
        // Check 2: Any dynamic summary rows exist (data-cd-summary-row)
        const dynamicRows = section.querySelectorAll('[data-cd-summary-row="true"]');
        if (dynamicRows.length > 0) {
            console.log('👁️ Found ' + dynamicRows.length + ' dynamic rows');
            return true;
        }
        
        // Check 3: Any data-cd-summary-for containers have visible rows
        const summaryContainers = section.querySelectorAll('[data-cd-summary-for]');
        for (let i = 0; i < summaryContainers.length; i++) {
            const container = summaryContainers[i];
            const rows = container.querySelectorAll('[data-cd-summary-row="true"]');
            if (rows.length > 0) {
                console.log('👁️ Found summary container with ' + rows.length + ' rows');
                return true;
            }
        }
        
        console.log('👁️ No content found in section');
        return false;
    }
    
    function showSection(section, sectionName) {
        console.log('👁️ Showing section: ' + sectionName);
        section.style.display = '';
        section.removeAttribute('aria-hidden');
        section.removeAttribute('hidden');
    }
    
    function hideSection(section, sectionName) {
        console.log('👁️ Hiding section: ' + sectionName);
        section.style.display = 'none';
        section.setAttribute('aria-hidden', 'true');
    }
    
    function updateAllSummaryFields() {
        console.log('📋 Updating all summary fields...');
        
        // Find all summary fields (excluding those in dynamic row templates)
        const summaryFields = document.querySelectorAll('[data-cd-input-field]:not([data-cd-summary-template] [data-cd-input-field])');
        console.log('📋 Found ' + summaryFields.length + ' summary fields to update');
        
        summaryFields.forEach(function(summaryField, index) {
            const fieldName = summaryField.getAttribute('data-cd-input-field');
            if (!fieldName) return;
            
            console.log('📋 Processing summary field ' + (index + 1) + ': "' + fieldName + '"');
            
            // Find corresponding form input by name
            const formInput = document.querySelector('input[name="' + fieldName + '"], select[name="' + fieldName + '"], textarea[name="' + fieldName + '"]');
            
            if (!formInput) {
                console.log('📋 No form input found for: ' + fieldName);
                return;
            }
            
            // Get value based on input type
            let value = '';
            if (formInput.type === 'radio') {
                const checkedRadio = document.querySelector('input[name="' + fieldName + '"]:checked');
                value = checkedRadio ? checkedRadio.value : '';
            } else if (formInput.type === 'checkbox') {
                if (formInput.checked) {
                    value = formInput.value || 'Yes';
                }
                // For multiple checkboxes with same name, collect all checked values
                const checkboxes = document.querySelectorAll('input[name="' + fieldName + '"]:checked');
                if (checkboxes.length > 1) {
                    const values = [];
                    checkboxes.forEach(function(cb) {
                        values.push(cb.value);
                    });
                    value = values.join(', ');
                } else if (checkboxes.length === 1) {
                    value = checkboxes[0].value || 'Yes';
                }
            } else {
                value = formInput.value || '';
            }
            
            console.log('📋 Field "' + fieldName + '" value: "' + value + '"');
            
            // Update summary field (only if has content)
            if (value && value.trim()) {
                summaryField.textContent = value;
                console.log('📋 Updated summary field: ' + fieldName + ' = "' + value + '"');
            } else {
                // Clear field if no value (don't show [Value] placeholder for empty fields)
                summaryField.textContent = '';
                console.log('📋 Cleared summary field: ' + fieldName + ' (no value)');
            }
        });
        
        console.log('📋 All summary fields updated');
    }
    
    function attachSummaryUpdateListeners() {
        console.log('📋 Attaching summary update listeners to form inputs...');
        
        // Find all form inputs that might have corresponding summary fields
        const formInputs = document.querySelectorAll('input, select, textarea');
        console.log('📋 Found ' + formInputs.length + ' form inputs');
        
        formInputs.forEach(function(input) {
            const inputName = input.getAttribute('name');
            if (!inputName) return;
            
            // Check if there's a corresponding summary field
            const summaryField = document.querySelector('[data-cd-input-field="' + inputName + '"]:not([data-cd-summary-template] [data-cd-input-field])');
            if (!summaryField) return;
            
            // Add event listeners if not already added
            if (!input.__cdSummaryListenerStatic) {
                input.__cdSummaryListenerStatic = true;
                
                // Update on blur (when user finishes editing)
                input.addEventListener('blur', function() {
                    console.log('📋 Input blur event for: ' + inputName);
                    updateAllSummaryFields();
                });
                
                // Update on change (for radios, checkboxes, selects)
                input.addEventListener('change', function() {
                    console.log('📋 Input change event for: ' + inputName);
                    updateAllSummaryFields();
                });
                
                console.log('📋 Added summary update listeners to: ' + inputName);
            }
        });
        
        console.log('📋 Summary update listeners attached');
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
        
        // Initialize conditional summary section visibility
        manageSummarySectionVisibility();
        
        // Attach summary update listeners to form inputs
        attachSummaryUpdateListeners();
        
        // Update all static summary fields on initialization
        updateAllSummaryFields();
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