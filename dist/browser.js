// CD Form Library - Browser Version
// Simple IIFE for direct browser use without module dependencies

(function() {
    'use strict';
    
    const VERSION = '0.1.26';
    
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
        
        // Find all row wrappers (elements with class containing "row-wrapper")
        const rowWrappers = document.querySelectorAll('[class*="row-wrapper"]');
        console.log('🔧 Found ' + rowWrappers.length + ' row wrappers');
        
        // Group row wrappers by their common prefix to identify related rows
        const rowGroups = new Map();
        
        for (let i = 0; i < rowWrappers.length; i++) {
            const wrapper = rowWrappers[i];
            const classList = wrapper.className.split(' ');
            
            // Look for classes that end with "row-wrapper"
            let groupName = '';
            for (let j = 0; j < classList.length; j++) {
                const className = classList[j];
                if (className.includes('row-wrapper')) {
                    // Extract the prefix (everything before "row-wrapper")
                    groupName = className.replace(/[-_]?row[-_]?wrapper.*$/i, '');
                    break;
                }
            }
            
            if (groupName) {
                if (!rowGroups.has(groupName)) {
                    rowGroups.set(groupName, []);
                }
                rowGroups.get(groupName).push(wrapper);
                console.log('🔧 Added wrapper to group "' + groupName + '":', wrapper);
            }
        }
        
        console.log('🔧 Found ' + rowGroups.size + ' row groups');
        
        // Process each row group
        rowGroups.forEach(function(wrappers, groupName) {
            console.log('🔧 Processing row group "' + groupName + '" with ' + wrappers.length + ' rows');
            
            // Add data-repeat-name attributes to inputs in each row
            for (let i = 0; i < wrappers.length; i++) {
                const wrapper = wrappers[i];
                const inputs = wrapper.querySelectorAll('input, select, textarea');
                const rowIndex = i;
                
                console.log('🔧 Processing row ' + (i + 1) + ' with ' + inputs.length + ' inputs');
                
                for (let j = 0; j < inputs.length; j++) {
                    const input = inputs[j];
                    const originalName = input.getAttribute('name') || '';
                    
                    // Create unique name for this row
                    if (originalName && !originalName.includes('[' + rowIndex + ']')) {
                        const newName = originalName + '[' + rowIndex + ']';
                        input.setAttribute('name', newName);
                        input.setAttribute('data-repeat-name', originalName);
                        console.log('🔧 Updated input name: ' + originalName + ' -> ' + newName);
                    }
                }
            }
            
            // Set up add/remove button functionality
            setupRowButtons(groupName, wrappers);
        });
        
        console.log('🔧 Dynamic rows initialization complete');
    }
    
    function setupRowButtons(groupName, wrappers) {
        console.log('🔧 Setting up buttons for group "' + groupName + '"');
        
        // Find add and remove buttons for this group
        const addButtons = document.querySelectorAll('[class*="' + groupName + '"][class*="add"], [data-action*="add"][class*="' + groupName + '"]');
        const removeButtons = document.querySelectorAll('[class*="' + groupName + '"][class*="remove"], [data-action*="remove"][class*="' + groupName + '"]');
        
        console.log('🔧 Found ' + addButtons.length + ' add buttons and ' + removeButtons.length + ' remove buttons for group "' + groupName + '"');
        
        // Add event listeners to add buttons
        for (let i = 0; i < addButtons.length; i++) {
            const button = addButtons[i];
            button.addEventListener('click', function(e) {
                e.preventDefault();
                addRow(groupName, wrappers);
            });
            console.log('🔧 Add button listener attached for group "' + groupName + '"');
        }
        
        // Add event listeners to remove buttons
        for (let i = 0; i < removeButtons.length; i++) {
            const button = removeButtons[i];
            button.addEventListener('click', function(e) {
                e.preventDefault();
                removeRow(groupName, wrappers, this);
            });
            console.log('🔧 Remove button listener attached for group "' + groupName + '"');
        }
    }
    
    function addRow(groupName, wrappers) {
        console.log('🔧 Adding row to group "' + groupName + '"');
        
        if (wrappers.length === 0) return;
        
        // Clone the first wrapper as template
        const template = wrappers[0];
        const newRow = template.cloneNode(true);
        const newIndex = wrappers.length;
        
        // Clear values and update names in the new row
        const inputs = newRow.querySelectorAll('input, select, textarea');
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            
            // Clear the value
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
            
            // Update the name with new index
            const originalName = input.getAttribute('data-repeat-name') || input.getAttribute('name') || '';
            if (originalName) {
                const baseName = originalName.replace(/\[\d+\]$/, '');
                const newName = baseName + '[' + newIndex + ']';
                input.setAttribute('name', newName);
                input.setAttribute('data-repeat-name', baseName);
            }
        }
        
        // Insert the new row after the last existing row
        const lastWrapper = wrappers[wrappers.length - 1];
        lastWrapper.parentNode.insertBefore(newRow, lastWrapper.nextSibling);
        
        // Add the new wrapper to our tracking array
        wrappers.push(newRow);
        
        // Dispatch custom event
        newRow.dispatchEvent(new CustomEvent('dynamic-rows:added', { 
            bubbles: true,
            detail: { groupName: groupName, rowIndex: newIndex }
        }));
        
        console.log('🔧 Row added to group "' + groupName + '", new total: ' + wrappers.length);
    }
    
    function removeRow(groupName, wrappers, clickedButton) {
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
            
            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];
                const baseName = input.getAttribute('data-repeat-name') || '';
                if (baseName) {
                    const newName = baseName + '[' + i + ']';
                    input.setAttribute('name', newName);
                }
            }
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('dynamic-rows:removed', { 
            bubbles: true,
            detail: { groupName: groupName, removedIndex: targetIndex }
        }));
        
        console.log('🔧 Row removed from group "' + groupName + '", new total: ' + wrappers.length);
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