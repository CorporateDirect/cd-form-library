// Browser-specific build for cd-form-library
// This will be compiled to a simple IIFE for direct browser use

import { Maskito } from '@maskito/core';
import { maskitoDateOptionsGenerator, maskitoTimeOptionsGenerator } from '@maskito/kit';

const VERSION = '0.1.119';

// Debug mode configuration - can be controlled via URL param or localStorage
const DEBUG_MODE = (() => {
  // Check URL parameter first: ?cd-debug=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('cd-debug')) {
    return urlParams.get('cd-debug') === 'true';
  }
  
  // Check localStorage: localStorage.setItem('cd-debug', 'true')
  try {
    return localStorage.getItem('cd-debug') === 'true';
  } catch {
    return false; // Default to false if localStorage unavailable
  }
})();

// Debug logging helpers
const debugLog = (...args: any[]) => DEBUG_MODE && console.log(...args);
const debugWarn = (...args: any[]) => DEBUG_MODE && console.warn(...args);
const infoLog = (...args: any[]) => console.log(...args); // Always show important info
const errorLog = (...args: any[]) => console.error(...args); // Always show errors

interface FormatConfig {
  type: 'date' | 'time' | 'percent' | 'number';
  pattern: string;
  defaultMeridiem?: 'AM' | 'PM';
}


function parseFormat(attr: string): FormatConfig | null {
  const normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
  
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
  if (normalized === 'time:h:mm am' || normalized === 'time:h:mm') {
    return { type: 'time', pattern: 'h:mm', defaultMeridiem: 'AM' };
  }
  if (normalized === 'time:h:mm pm') {
    return { type: 'time', pattern: 'h:mm', defaultMeridiem: 'PM' };
  }
  if (normalized === 'time:hh:mm' || normalized === 'time:hh:mm am') {
    return { type: 'time', pattern: 'hh:mm', defaultMeridiem: 'AM' };
  }
  if (normalized === 'time:hh:mm pm') {
    return { type: 'time', pattern: 'hh:mm', defaultMeridiem: 'PM' };
  }
  if (normalized === 'number') {
    return { type: 'number', pattern: 'number' };
  }
  if (normalized === 'percent') {
    return { type: 'percent', pattern: 'percent' };
  }
  
  return null;
}

function createMaskitoOptions(config: FormatConfig) {
  if (config.type === 'date') {
    const mode = config.pattern === 'mmddyyyy' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
    return maskitoDateOptionsGenerator({
      mode,
      separator: '/'
    });
  } else if (config.type === 'time') {
    if (config.pattern === 'h:mm') {
      // Check if this is AM/PM format
      const hasAmPm = config.defaultMeridiem !== undefined;
      
      if (hasAmPm) {
        // 12-hour format with AM/PM
        return {
          mask: [/\d/, /\d?/, ':', /\d/, /\d/, ' ', /[APap]/, /[Mm]/],
          preprocessors: [
            ({ elementState, data }: { elementState: any; data: string }) => {
              // Auto-format time input
              const currentDigits = elementState.value.replace(/[^\d]/g, '');
              
              if (/^\d+$/.test(data)) {
                const allDigits = currentDigits + data;
                
                if (allDigits.length === 1) {
                  // "1" -> "1:"
                  return { elementState, data: allDigits + ':' };
                } else if (allDigits.length === 2) {
                  const hour = parseInt(allDigits);
                  if (hour > 12) {
                    // "15" -> "1:5"  
                    return { elementState, data: allDigits[0] + ':' + allDigits[1] };
                  } else {
                    // "12" -> "12:"
                    return { elementState, data: allDigits + ':' };
                  }
                } else if (allDigits.length === 3) {
                  // "115" -> "1:15"
                  return { elementState, data: allDigits[0] + ':' + allDigits.slice(1) + ' ' + config.defaultMeridiem };
                } else if (allDigits.length === 4) {
                  // "1230" -> "12:30" 
                  return { elementState, data: allDigits.slice(0, 2) + ':' + allDigits.slice(2) + ' ' + config.defaultMeridiem };
                }
              }
              
              // Handle AM/PM input
              if (/[apAP]/i.test(data)) {
                const upperData = data.toUpperCase();
                if (upperData === 'A' || upperData === 'P') {
                  return { elementState, data: ' ' + upperData + 'M' };
                }
                if (upperData === 'AM' || upperData === 'PM') {
                  return { elementState, data: ' ' + upperData };
                }
              }
              
              return { elementState, data };
            }
          ],
          postprocessors: [
            ({ value, selection }: { value: string; selection: readonly [number, number] }) => {
              // Validate and clean up format
              const match = value.match(/^(\d{1,2}):(\d{2})(\s+(AM|PM))?/i);
              if (match) {
                let hour = parseInt(match[1]);
                const minute = parseInt(match[2]);
                let ampm = match[4]?.toUpperCase() || config.defaultMeridiem;
                
                // Validate ranges
                if (hour < 1 || hour > 12 || minute > 59) {
                  return { value: value.slice(0, -1), selection };
                }
                
                // Ensure proper format
                const formattedTime = `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                return { value: formattedTime, selection };
              }
              
              return { value, selection };
            }
          ]
        };
      } else {
        // 24-hour format without AM/PM
        return {
          mask: [/\d/, /\d?/, ':', /\d/, /\d/],
          preprocessors: [
            ({ elementState, data }: { elementState: any; data: string }) => {
              if (/^\d+$/.test(data)) {
                const currentDigits = elementState.value.replace(/[^\d]/g, '');
                const allDigits = currentDigits + data;
                
                if (allDigits.length === 1) {
                  return { elementState, data: allDigits + ':' };
                } else if (allDigits.length === 3) {
                  return { elementState, data: allDigits[0] + ':' + allDigits.slice(1) };
                } else if (allDigits.length === 4) {
                  return { elementState, data: allDigits.slice(0, 2) + ':' + allDigits.slice(2) };
                }
              }
              return { elementState, data };
            }
          ]
        };
      }
    } else if (config.pattern === 'hh:mm') {
      // 2-digit hour format (HH:MM)
      const hasAmPm = config.defaultMeridiem !== undefined;
      
      if (hasAmPm) {
        // 12-hour format with AM/PM
        return maskitoTimeOptionsGenerator({
          mode: 'HH:MM AA'
        });
      } else {
        // 24-hour format
        return maskitoTimeOptionsGenerator({
          mode: 'HH:MM'
        });
      }
    } else {
      // Traditional strict 2-digit hour format  
      return maskitoTimeOptionsGenerator({
        mode: 'HH:MM AA'
      });
    }
  } else if (config.type === 'number') {
    // Number formatting with thousands separators
    return {
      mask: /^-?\d+(,\d{3})*(\.\d+)?$/,
      preprocessors: [
        ({ elementState, data }: { elementState: any; data: string }) => {
          // Remove existing commas for processing
          const cleanValue = elementState.value.replace(/,/g, '');
          const cleanData = data.replace(/,/g, '');
          return {
            elementState: { ...elementState, value: cleanValue },
            data: cleanData
          };
        }
      ],
      postprocessors: [
        ({ value, selection }: { value: string; selection: readonly [number, number] }) => {
          // Add thousands separators
          if (value && /^-?\d+(\.\d*)?$/.test(value)) {
            const parts = value.split('.');
            const integerPart = parts[0];
            const decimalPart = parts[1];
            
            // Add commas to integer part
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            const formattedValue = decimalPart !== undefined 
              ? `${formattedInteger}.${decimalPart}`
              : formattedInteger;
            
            return {
              value: formattedValue,
              selection: [selection[0], selection[1]] as const
            };
          }
          return { value, selection };
        }
      ]
    };
  } else if (config.type === 'percent') {
    // Simple percent mask: numbers + optional decimal + %
    return {
      mask: /^\d{0,3}(\.\d{0,2})?%?$/,
      preprocessors: [
        ({ elementState, data }: { elementState: any; data: string }) => {
          // Remove existing % for processing
          const cleanValue = elementState.value.replace('%', '');
          const cleanData = data.replace('%', '');
          return {
            elementState: { ...elementState, value: cleanValue },
            data: cleanData
          };
        }
      ],
      postprocessors: [
        ({ value, selection }: { value: string; selection: readonly [number, number] }) => {
          // Add % if not present and value has content
          if (value && !value.endsWith('%')) {
            return {
              value: value + '%',
              selection: [selection[0], selection[1]] as const
            };
          }
          return { value, selection };
        }
      ]
    };
  }
  return null;
}

function initInputFormatting(form: HTMLFormElement) {
  const inputs = form.querySelectorAll('input[data-input]');
  inputs.forEach((el, index) => {
    const input = el as HTMLInputElement;
    const attr = input.getAttribute('data-input');
    
    if (!attr) return;

    const config = parseFormat(attr);
    if (!config) return;

    const maskitoOptions = createMaskitoOptions(config);
    if (!maskitoOptions) return;
    
    // Initialize Maskito on the input
    const maskito = new Maskito(input, maskitoOptions);
    
    // Dispatch bound event
    input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

    // Track changes for event dispatch
    let previousValue = input.value;
    
    input.addEventListener('input', () => {
      const newValue = input.value;
      if (newValue !== previousValue) {
        input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
          bubbles: true,
          detail: { raw: previousValue, formatted: newValue }
        }));
        previousValue = newValue;
      }
    });

    input.addEventListener('blur', () => {
      const isValid = input.value.length === 0 || input.checkValidity();
      input.setAttribute('aria-invalid', (!isValid).toString());

      if (!isValid) {
        input.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
      }
    });

    // Store maskito instance for cleanup if needed
    (input as any).__maskito = maskito;
  });
}

// Form wrapper visibility implementation
function initFormWrapperVisibility() {
  const wrappers = document.querySelectorAll('[data-show-when]');
  
  // Track all input groups that wrappers are listening to
  const groupListeners = new Map<string, Set<Element>>();
  
  wrappers.forEach((wrapper, index) => {
    const condition = wrapper.getAttribute('data-show-when');
    if (!condition) return;
    
    const [group, value] = condition.split('=').map(s => s.trim());
    if (!group || value === undefined) return;
    
    // Track this wrapper as listening to this group
    if (!groupListeners.has(group)) {
      groupListeners.set(group, new Set());
    }
    groupListeners.get(group)!.add(wrapper);
    
    // Set initial visibility
    updateWrapperVisibility(wrapper, group, value);
  });
  
  // Attach event listeners to input groups
  groupListeners.forEach((wrappers, group) => {
    const inputs = document.querySelectorAll(`input[name="${group}"], select[name="${group}"], textarea[name="${group}"]`);
    
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        wrappers.forEach((wrapper) => {
          const condition = wrapper.getAttribute('data-show-when');
          if (!condition) return;
          
          const [, value] = condition.split('=').map(s => s.trim());
          updateWrapperVisibility(wrapper, group, value);
        });
      });
    });
  });
}

function updateWrapperVisibility(wrapper: Element, group: string, targetValue: string) {
  const inputs = document.querySelectorAll(`input[name="${group}"], select[name="${group}"], textarea[name="${group}"]`);
  let currentValue = '';
  
  // Get current value from inputs
  inputs.forEach((input) => {
    const el = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    if (el.type === 'radio' || el.type === 'checkbox') {
      const radioInput = el as HTMLInputElement;
      if (radioInput.checked) {
        currentValue = radioInput.value;
      }
    } else {
      currentValue = el.value;
    }
  });
  
  const shouldShow = currentValue === targetValue;
  const htmlWrapper = wrapper as HTMLElement;
  
  if (shouldShow) {
    htmlWrapper.style.display = '';
    htmlWrapper.removeAttribute('aria-hidden');
    
    // Make focusable elements accessible again
    const focusableElements = htmlWrapper.querySelectorAll('input, select, textarea, button, [tabindex]');
    focusableElements.forEach((el) => {
      (el as HTMLElement).removeAttribute('tabindex');
    });
    
    // Dispatch shown event
    wrapper.dispatchEvent(new CustomEvent('form-wrapper-visibility:shown', { bubbles: true }));
  } else {
    htmlWrapper.style.display = 'none';
    htmlWrapper.setAttribute('aria-hidden', 'true');
    
    // Remove from tab order
    const focusableElements = htmlWrapper.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach((el) => {
      (el as HTMLElement).setAttribute('tabindex', '-1');
    });
    
    // Dispatch hidden event
    wrapper.dispatchEvent(new CustomEvent('form-wrapper-visibility:hidden', { bubbles: true }));
  }
}

// Dynamic Rows implementation
interface DynamicRowGroup {
  groupName: string;
  container: Element;
  template: Element;
  namePattern: string;
  rows: Element[];
  addButton: Element | null;
}

const activeGroups = new Map<string, DynamicRowGroup>();

function initDynamicRows() {
  infoLog('🔄 Initializing Dynamic Rows...');
  
  const repeaterGroups = document.querySelectorAll('[data-cd-repeat-group]');
  debugLog('🔍 Found repeat groups:', repeaterGroups.length);
  
  if (repeaterGroups.length === 0) {
    debugWarn('⚠️ No elements found with data-cd-repeat-group attribute');
    // Check for common attribute name variations that might indicate misconfiguration
    const possibleGroups = document.querySelectorAll('[data-repeat-group], [data-cd-repeater-group], [data-repeater-group]');
    debugLog('🔍 Found elements with similar attributes:', possibleGroups.length);
    if (possibleGroups.length > 0) {
      debugLog('🔍 First possible group:', possibleGroups[0]);
      debugLog('🔍 Its attributes:', Array.from(possibleGroups[0].attributes).map(attr => `${attr.name}="${attr.value}"`));
    }
    return;
  }
  
  repeaterGroups.forEach((container, index) => {
    debugLog(`🎯 Processing Group ${index + 1}:`, container.tagName, container.className);
    
    const groupName = container.getAttribute('data-cd-repeat-group');
    debugLog('🔍 Group name:', groupName);
    
    if (!groupName) {
      errorLog('❌ No group name found, skipping');
      return;
    }
    
    // Skip if container is hidden (will be reinitialized when shown)
    const computedStyle = window.getComputedStyle(container);
    const isHidden = computedStyle.display === 'none';
    debugLog('🔍 Container display/hidden:', computedStyle.display, isHidden);
    
    if (isHidden) {
      debugLog('⏭️ Skipping hidden container (will reinitialize when shown)');
      return;
    }
    
    debugLog('✅ Proceeding to initialize group:', groupName);
    initializeDynamicRowGroup(groupName, container);
  });
  
  infoLog('✅ Dynamic rows initialization complete');
}

function initializeDynamicRowGroup(groupName: string, container: Element) {
  // Find template row and add button - support both attribute patterns
  let template = container.querySelector('[data-cd-repeat-template]');
  
  // First try inside the container
  let addButton = container.querySelector('[data-cd-add-row]') || container.querySelector(`[data-cd-repeat-add="${groupName}"]`);
  
  // If not found inside, search in parent or document (Webflow pattern)
  if (!addButton) {
    // Search in parent element
    if (container.parentElement) {
      addButton = container.parentElement.querySelector(`[data-cd-repeat-add="${groupName}"]`) ||
                  container.parentElement.querySelector('[data-cd-add-row]');
    }
    
    // If still not found, search globally in document
    if (!addButton) {
      addButton = document.querySelector(`[data-cd-repeat-add="${groupName}"]`);
    }
    
    // Last resort - find any button that might be related to this group
    if (!addButton) {
      // Look for buttons containing the group name in their attributes or text
      const allButtons = document.querySelectorAll('[data-cd-add-row], [data-cd-repeat-add]');
      for (const btn of Array.from(allButtons)) {
        const repeatAdd = btn.getAttribute('data-cd-repeat-add');
        const addRow = btn.getAttribute('data-cd-add-row');
        if (repeatAdd === groupName || addRow === groupName || 
            btn.textContent?.toLowerCase().includes(groupName.toLowerCase())) {
          addButton = btn;
          break;
        }
      }
    }
  }
  
  const namePattern = container.getAttribute('data-cd-name-pattern') || `${groupName}[{i}][{field}]`;
  
  debugLog(`🔧 Initializing group: "${groupName}"`, container.tagName, !!template, !!addButton);
  
  if (!addButton) {
    debugWarn(`❌ No add button found for group "${groupName}". Checked selectors: [data-cd-add-row], [data-cd-repeat-add="${groupName}"]`);
    const allAddButtons = document.querySelectorAll('[data-cd-add-row], [data-cd-repeat-add]');
    debugLog('🔍 Total add buttons in document:', allAddButtons.length);
    if (DEBUG_MODE && allAddButtons.length > 0) {
      allAddButtons.forEach((btn, i) => {
        debugLog(`  ${i + 1}. ${btn.tagName} - data-cd-repeat-add: "${btn.getAttribute('data-cd-repeat-add')}" - data-cd-add-row: "${btn.getAttribute('data-cd-add-row')}"`);
      });
    }
  }
  
  // If no template exists, create one from the first existing row
  if (!template) {
    debugLog('🔍 No template found, searching for existing rows...');
    const firstRow = container.querySelector('[data-cd-repeat-row]');
    debugLog('🔍 First existing row found:', !!firstRow);
    
    if (firstRow) {
      debugLog('🔍 First row details:', firstRow.tagName, firstRow.className);
      
      template = firstRow.cloneNode(true) as Element;
      template.setAttribute('data-cd-repeat-template', '');
      
      // Clear input values in template
      const inputs = template.querySelectorAll('input, select, textarea');
      debugLog('🔍 Clearing', inputs.length, 'input values in template');
      inputs.forEach((input) => {
        (input as HTMLInputElement).value = '';
      });
      
      // Hide the template and insert it at the beginning
      (template as HTMLElement).style.display = 'none';
      container.insertBefore(template, firstRow);
      debugLog(`✅ Created and hid template from first row for group "${groupName}"`);
    } else {
      console.log('🔍 Searching for elements with similar row attributes...');
      const possibleRows = container.querySelectorAll('[data-repeat-row], [data-cd-repeater-row], [data-repeater-row]');
      console.log('🔍 Found possible rows:', possibleRows.length);
      if (possibleRows.length > 0) {
        console.log('🔍 First possible row:', possibleRows[0]);
        console.log('🔍 Its attributes:', Array.from(possibleRows[0].attributes).map(attr => `${attr.name}="${attr.value}"`));
      }
    }
  } else {
    console.log('✅ Template found:', template.tagName, template.className);
    // Hide the template since it's just for cloning
    (template as HTMLElement).style.display = 'none';
  }
  
  if (!template) {
    console.error('❌ No template available, cannot initialize group');
    return;
  }

  // Get existing rows (excluding template)
  const existingRows = Array.from(container.querySelectorAll('[data-cd-repeat-row]:not([data-cd-repeat-template])'));
  console.log('🔍 Found existing data rows:', existingRows.length);
  
  existingRows.forEach((row, index) => {
    console.log(`🔍 Existing row ${index + 1}:`, {
      tag: row.tagName,
      class: row.className,
      'data-cd-repeat-row': row.getAttribute('data-cd-repeat-row')
    });
  });
  
  // Ensure exactly one row is visible
  if (existingRows.length === 0) {
    console.log('🔍 No existing data rows, creating first row from template...');
    const firstRow = template.cloneNode(true) as Element;
    firstRow.removeAttribute('data-cd-repeat-template');
    (firstRow as HTMLElement).style.display = '';
    container.appendChild(firstRow);
    existingRows.push(firstRow);
  } else {
    // Make sure only the first row is visible, hide any extra rows
    existingRows.forEach((row, index) => {
      const htmlRow = row as HTMLElement;
      if (index === 0) {
        htmlRow.style.display = '';
        htmlRow.removeAttribute('aria-hidden');
        console.log(`🔍 Keeping first row visible: row ${index + 1}`);
      } else {
        htmlRow.style.display = 'none';
        htmlRow.setAttribute('aria-hidden', 'true');
        console.log(`🔍 Hiding extra row: row ${index + 1}`);
      }
    });
    
    // Keep only the first row in the array
    if (existingRows.length > 1) {
      console.log(`🔍 Removing ${existingRows.length - 1} extra rows from DOM`);
      for (let i = 1; i < existingRows.length; i++) {
        existingRows[i].remove();
      }
      existingRows.splice(1); // Keep only first row
    }
  }
  
  const group: DynamicRowGroup = {
    groupName,
    container,
    template,
    namePattern,
    rows: existingRows,
    addButton
  };
  
  // Store the group
  activeGroups.set(groupName, group);
  
  // Attach add button listener
  if (addButton) {
    console.log(`➕ Attaching add button listener for group "${groupName}"`);
    // Remove any existing listeners
    addButton.removeEventListener('click', handleAddRow);
    addButton.addEventListener('click', handleAddRow);
  } else {
    console.warn(`❌ No add button found for group "${groupName}". Checked selectors: [data-cd-add-row], [data-cd-repeat-add="${groupName}"]`);
  }

  // Attach remove button listeners - support both attribute patterns and any group name
  const removeButtons = container.querySelectorAll('[data-cd-remove-row], [data-cd-repeat-remove]');
  console.log(`🔗 Found ${removeButtons.length} remove buttons for group "${groupName}"`);
  removeButtons.forEach((removeButton) => {
    const removeAttr = removeButton.getAttribute('data-cd-repeat-remove');
    if (removeAttr) {
      console.log(`🔗 Remove button references group: "${removeAttr}" (should be "${groupName}")`);
    }
    // Remove any existing listeners
    removeButton.removeEventListener('click', handleRemoveRow);
    removeButton.addEventListener('click', handleRemoveRow);
  });
  
  // Apply input formatting to existing rows
  applyFormattingToRows(group);
  
  // Reindex existing rows
  reindexRows(group);
  
  // Update summaries
  updateSummaries(group);
}

function applyFormattingToRows(group: DynamicRowGroup) {
  console.log(`🎨 Applying formatting to ${group.rows.length} existing rows in group "${group.groupName}"`);
  
  group.rows.forEach((row, index) => {
    const inputs = row.querySelectorAll('input[data-input]');
    console.log(`🎨 Row ${index + 1}: found ${inputs.length} inputs with data-input attribute`);
    
    inputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;
      const attr = inputElement.getAttribute('data-input');
      
      if (!attr) return;
      
      console.log(`🎨 Applying formatting to input: data-input="${attr}"`);
      
      const config = parseFormat(attr);
      if (config) {
        const maskitoOptions = createMaskitoOptions(config);
        if (maskitoOptions) {
          // Clean up any existing maskito instance first
          if ((inputElement as any).__maskito) {
            (inputElement as any).__maskito.destroy();
          }
          
          // Initialize new Maskito instance
          const maskito = new Maskito(inputElement, maskitoOptions);
          (inputElement as any).__maskito = maskito;
          
          // Dispatch bound event
          inputElement.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
          
          console.log(`✅ Maskito applied to existing input with data-input="${attr}"`);
        }
      }
    });
  });
}

function handleAddRow(event: Event) {
  console.log(`🖱️ Add button clicked!`, event.target);
  event.preventDefault();
  
  // The clicked element might be nested inside the actual button
  const clickedElement = event.target as Element;
  const button = clickedElement.closest('[data-cd-repeat-add]') || clickedElement.closest('[data-cd-add-row]');
  
  console.log(`🔍 Event details:`, {
    clickedElement: clickedElement.tagName,
    clickedClass: clickedElement.className,
    foundButton: !!button,
    buttonAttr: button ? button.getAttribute('data-cd-repeat-add') || button.getAttribute('data-cd-add-row') : 'none'
  });
  
  if (!button) {
    console.error('❌ No add button found from clicked element');
    return;
  }
  
  // Get the group name from the button's attribute first
  const groupName = button.getAttribute('data-cd-repeat-add') || button.getAttribute('data-cd-add-row');
  
  console.log(`🔍 Searching for container from button:`, {
    button: button.tagName,
    buttonClass: button.className,
    groupName: groupName
  });
  
  if (!groupName) {
    console.error('❌ No group name found on add button');
    return;
  }
  
  // Find the container by group name since buttons are siblings, not children
  const container = document.querySelector(`[data-cd-repeat-group="${groupName}"]`);
  
  console.log(`🔍 Container lookup result:`, {
    groupName: groupName,
    containerFound: !!container
  });
  
  if (!container) {
    console.error(`❌ No container found for group "${groupName}"`);
    return;
  }
  
  console.log(`📝 Found container for group: "${groupName}"`);
  
  const group = activeGroups.get(groupName);
  console.log(`📦 Retrieved group:`, !!group);
  
  if (!group) {
    console.error(`❌ No group found in activeGroups for "${groupName}"`);
    return;
  }
  
  addNewRow(group);
}

function handleRemoveRow(event: Event) {
  event.preventDefault();
  const button = event.target as Element;
  const container = button.closest('[data-cd-repeat-group]');
  if (!container) return;
  
  const groupName = container.getAttribute('data-cd-repeat-group');
  if (!groupName) return;
  
  const group = activeGroups.get(groupName);
  if (!group) return;
  
  // Find which row contains the clicked button
  const rowInfo = findRowContainingElement(group, button);
  if (!rowInfo) return;
  
  removeRow(group, rowInfo.row);
}

function addNewRow(group: DynamicRowGroup) {
  console.log(`➕ Adding new row to group "${group.groupName}" (currently ${group.rows.length} rows)`);
  
  // Check if we've reached the maximum of 5 total rows (1 original + 4 additional)
  if (group.rows.length >= 5) {
    console.log(`⚠️ Maximum rows reached for group "${group.groupName}" (5 rows max)`);
    // Disable the add button
    if (group.addButton) {
      (group.addButton as HTMLElement).style.opacity = '0.5';
      (group.addButton as HTMLElement).style.pointerEvents = 'none';
      console.log(`🚫 Add button disabled for group "${group.groupName}"`);
    }
    return;
  }
  
  // Clone from the template instead of visible rows to avoid copying user data
  const template = group.container.querySelector('[data-cd-repeat-template]');
  
  if (!template) {
    console.error('❌ No template found to clone');
    return;
  }
  
  const newRow = template.cloneNode(true) as Element;
  
  // Remove template attribute from cloned row
  newRow.removeAttribute('data-cd-repeat-template');
  
  // Clear input values in the cloned row and apply formatting
  const inputs = newRow.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const inputElement = input as HTMLInputElement;
    inputElement.value = '';
    
    // Apply Maskito formatting to inputs with data-input attribute
    const attr = inputElement.getAttribute('data-input');
    if (attr) {
      console.log(`➕ Applying formatting to new input: data-input="${attr}"`);
      
      const config = parseFormat(attr);
      if (config) {
        const maskitoOptions = createMaskitoOptions(config);
        if (maskitoOptions) {
          // Clean up any existing maskito instance first
          if ((inputElement as any).__maskito) {
            (inputElement as any).__maskito.destroy();
          }
          
          // Initialize new Maskito instance
          const maskito = new Maskito(inputElement, maskitoOptions);
          (inputElement as any).__maskito = maskito;
          
          // Dispatch bound event
          inputElement.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
          
          console.log(`✅ Maskito applied to new input with data-input="${attr}"`);
        }
      }
    }
  });
  
  // Ensure the new row is visible by adding the visible class and removing inline styles
  const htmlRow = newRow as HTMLElement;
  console.log(`➕ Before visibility fix - classes: ${htmlRow.className}, inline style: ${htmlRow.style.display}`);
  htmlRow.classList.add('visible-row');
  htmlRow.style.display = ''; // Remove any inline display style
  htmlRow.removeAttribute('aria-hidden');
  console.log(`➕ After visibility fix - classes: ${htmlRow.className}, inline style: ${htmlRow.style.display}`);
  
  // Append to the end of the container (after the initial row)
  group.container.appendChild(newRow);
  
  // Add to rows array
  group.rows.push(newRow);

  // Attach remove button listeners to the new row - support both attribute patterns
  const removeButtons = newRow.querySelectorAll('[data-cd-remove-row], [data-cd-repeat-remove]');
  console.log(`➕ Attaching ${removeButtons.length} remove button listeners to new row`);
  removeButtons.forEach((removeButton) => {
    removeButton.addEventListener('click', handleRemoveRow);
  });

  // Reinitialize tooltips in the new row
  reinitializeTooltipsInRow(newRow);

  // Reindex all rows
  reindexRows(group);

  // Update summaries
  updateSummaries(group);
  
  console.log(`➕ Row added successfully, new total: ${group.rows.length} rows`);
  
  // Check if we've reached the maximum of 5 total rows and disable the add button
  if (group.rows.length >= 5 && group.addButton) {
    (group.addButton as HTMLElement).style.opacity = '0.5';
    (group.addButton as HTMLElement).style.pointerEvents = 'none';
    console.log(`🚫 Add button disabled for group "${group.groupName}" after reaching maximum (${group.rows.length} rows)`);
  }
  
  // Dispatch event
  newRow.dispatchEvent(new CustomEvent('cd:row:added', {
    bubbles: true,
    detail: { groupName: group.groupName, rowIndex: group.rows.length - 1 }
  }));
}

function reindexRows(group: DynamicRowGroup) {
  console.log(`🔢 DYNAMIC: Reindexing ${group.rows.length} rows for group "${group.groupName}"`);
  
  group.rows.forEach((row, index) => {
    const rowIndex = index + 1; // 1-based indexing
    
    // Update input names with row suffix for unique field names
    const inputs = row.querySelectorAll('[data-cd-repeat-name]');
    console.log(`🔢 DYNAMIC: Row ${rowIndex}: found ${inputs.length} inputs with data-cd-repeat-name`);
    inputs.forEach((input) => {
      const fieldName = input.getAttribute('data-cd-repeat-name');
      if (fieldName) {
        // Use simple suffix pattern: {field}-{i} for unique field names
        const finalName = `${fieldName}-${rowIndex}`;
        (input as HTMLInputElement).name = finalName;
        console.log(`🔢 DYNAMIC: Row ${rowIndex}: Updated input name: ${fieldName} → ${finalName}`);
      }
    });
    
    // Update IDs and labels if present
    const elementsWithIds = row.querySelectorAll('[id]');
    elementsWithIds.forEach((element) => {
      const originalId = element.getAttribute('data-original-id');
      if (originalId) {
        element.id = `${originalId}-${rowIndex}`;
      } else if (!element.id.endsWith(`-${rowIndex}`)) {
        element.setAttribute('data-original-id', element.id);
        element.id = `${element.id}-${rowIndex}`;
      }
    });
    
    const labels = row.querySelectorAll('label[for]');
    labels.forEach((label) => {
      const originalFor = label.getAttribute('data-original-for');
      if (originalFor) {
        (label as HTMLLabelElement).htmlFor = `${originalFor}-${rowIndex}`;
      } else {
        const currentFor = (label as HTMLLabelElement).htmlFor;
        if (!currentFor.endsWith(`-${rowIndex}`)) {
          label.setAttribute('data-original-for', currentFor);
          (label as HTMLLabelElement).htmlFor = `${currentFor}-${rowIndex}`;
        }
      }
    });
  });
  
  // Dispatch synthetic input events to trigger summary updates
  console.log(`🔢 DYNAMIC: Dispatching input events to trigger summary updates`);
  group.rows.forEach((row, index) => {
    const inputs = row.querySelectorAll('input, select, textarea');
    console.log(`🔢 DYNAMIC: Row ${index + 1}: dispatching events for ${inputs.length} inputs`);
    inputs.forEach((input) => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  
  // Summary field syncing will be handled by updateSummaries() call
  console.log(`🔢 DYNAMIC: Summary fields will be synced by updateSummaries()`);
}

function updateSummaries(group: DynamicRowGroup) {
  console.log(`📊 SUMMARY: Updating summaries for group "${group.groupName}" (${group.rows.length} rows)`);
  
  // Find summary containers for this group
  const summaryContainers = document.querySelectorAll(`[data-cd-summary-for="${group.groupName}"]`);
  console.log(`📊 SUMMARY: Found ${summaryContainers.length} summary container(s) for group "${group.groupName}"`);
  
  summaryContainers.forEach((summaryContainer, containerIndex) => {
    const template = summaryContainer.querySelector('[data-cd-summary-template]');
    if (!template) {
      console.warn(`📊 SUMMARY: No template found in summary container ${containerIndex} for group "${group.groupName}"`);
      return;
    }
    
    // Remove existing summary rows
    const existingSummaryRows = summaryContainer.querySelectorAll('[data-summary-row]');
    console.log(`📊 SUMMARY: Removing ${existingSummaryRows.length} existing summary rows from container ${containerIndex}`);
    existingSummaryRows.forEach(row => row.remove());
    
    // Create summary rows for each data row
    console.log(`📊 SUMMARY: Creating ${group.rows.length} new summary rows for container ${containerIndex}`);
    group.rows.forEach((dataRow, index) => {
      const rowIndex = index + 1;
      const summaryRow = template.cloneNode(true) as Element;
      
      // Mark as summary row instead of template
      summaryRow.removeAttribute('data-cd-summary-template');
      summaryRow.setAttribute('data-summary-row', '');
      
      // Ensure the cloned summary row is visible (template may be hidden)
      (summaryRow as HTMLElement).style.display = '';
      
      // Update data-cd-input-field attributes to match new naming pattern
      const fieldElements = summaryRow.querySelectorAll('[data-cd-input-field]');
      console.log(`📊 SUMMARY: Processing ${fieldElements.length} field elements in summary row ${rowIndex}`);
      fieldElements.forEach((element) => {
        const fieldPattern = element.getAttribute('data-cd-input-field');
        if (fieldPattern) {
          // Convert from template pattern to actual field name with suffix
          // e.g., "person-entity-name-{i}" → "person-entity-name-1"
          const finalFieldName = fieldPattern.replace('{i}', rowIndex.toString());
          element.setAttribute('data-cd-input-field', finalFieldName);
          console.log(`📊 SUMMARY: Updated field: ${fieldPattern} → ${finalFieldName}`);
        }
      });
      
      // Insert the summary row
      summaryContainer.appendChild(summaryRow);
    });
    
    // Hide the summary template after creating all summary rows
    if (template) {
      (template as HTMLElement).style.display = 'none';
      console.log(`📊 SUMMARY: Summary template hidden for container ${containerIndex}`);
    }
  });

  // Sync field values after creating summary rows
  syncAllSummaryFields();

  // Add event listeners to re-sync when summary containers become visible
  // This handles cases where containers are initially hidden by data-show-when
  summaryContainers.forEach((summaryContainer) => {
    summaryContainer.addEventListener('form-wrapper-visibility:shown', () => {
      console.log(`📊 SUMMARY: *** CONTAINER BECAME VISIBLE *** Re-syncing fields for group "${group.groupName}"`);

      // Re-sync all fields in this container
      const fieldElements = summaryContainer.querySelectorAll('[data-cd-input-field]');
      console.log(`📊 SUMMARY: Found ${fieldElements.length} field elements to re-sync`);

      fieldElements.forEach((element, index) => {
        const fieldName = element.getAttribute('data-cd-input-field');
        console.log(`📊 SUMMARY: Re-syncing field ${index + 1}/${fieldElements.length}: "${fieldName}"`);
        if (fieldName) {
          syncSummaryField(element as HTMLElement, fieldName);
        }
      });

      // Trigger TryFormly refresh
      if (typeof (window as any).TryFormly?.refresh === 'function') {
        console.log('📊 SUMMARY: Triggering TryFormly.refresh() after visibility change');
        (window as any).TryFormly.refresh();
      }

      console.log(`📊 SUMMARY: *** VISIBILITY RE-SYNC COMPLETE ***`);
    });
  });

  // Trigger TryFormly refresh if available
  if (typeof (window as any).TryFormly?.refresh === 'function') {
    console.log('📊 SUMMARY: Triggering TryFormly.refresh()');
    (window as any).TryFormly.refresh();
  } else {
    console.log('📊 SUMMARY: TryFormly.refresh() not available');
  }
}

// Summary field synchronization functions
function syncAllSummaryFields() {
  console.log('🔄 SUMMARY: Syncing all summary fields...');
  
  // Find all summary output elements
  const summaryElements = document.querySelectorAll('[data-cd-input-field]');
  console.log(`🔄 SUMMARY: Found ${summaryElements.length} summary field elements`);
  
  summaryElements.forEach((summaryElement, index) => {
    const fieldName = summaryElement.getAttribute('data-cd-input-field');
    if (!fieldName) return;
    
    console.log(`🔄 SUMMARY: Syncing field ${index + 1}: "${fieldName}"`);
    syncSummaryField(summaryElement as HTMLElement, fieldName);
  });
}

function syncSummaryField(summaryElement: HTMLElement, fieldName: string) {
  // Find the corresponding input/select/textarea element
  let sourceElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;
  
  console.log(`🔍 SUMMARY: Syncing summary field: "${fieldName}"`);
  
  // Check if this is a templated field name with {i} placeholder
  if (fieldName.includes('{i}')) {
    console.log(`🔍 SUMMARY: Templated field detected: "${fieldName}"`);
    
    // Extract the row number from the summary element's context
    const summaryRow = summaryElement.closest('[data-summary-row]');
    if (summaryRow) {
      // Find all summary rows in the same container to determine the index
      const summaryContainer = summaryRow.parentElement;
      const allSummaryRows = Array.from(summaryContainer?.querySelectorAll('[data-summary-row]') || []);
      const rowIndex = allSummaryRows.indexOf(summaryRow) + 1; // 1-based indexing
      
      // Replace {i} with the actual row index
      let resolvedFieldName = fieldName.replace('{i}', rowIndex.toString());
      
      // Check if this is a bracket pattern that needs to be mapped to suffix pattern
      if (resolvedFieldName.includes('[') && resolvedFieldName.includes(']')) {
        // Convert bracket pattern to suffix pattern
        // e.g., "members[1][person_entity_name]" → "person_entity_name-1"
        const bracketMatch = resolvedFieldName.match(/\[(\d+)\]\[([^\]]+)\]/);
        if (bracketMatch) {
          const rowNum = bracketMatch[1];
          const baseFieldName = bracketMatch[2];
          resolvedFieldName = `${baseFieldName}-${rowNum}`;
          console.log(`🔍 SUMMARY: Converted bracket pattern: "${fieldName}" → "${resolvedFieldName}"`);
        }
      }
      
      console.log(`🔍 SUMMARY: Resolved templated field: "${fieldName}" → "${resolvedFieldName}"`);
      
      // Use the resolved field name for lookup
      fieldName = resolvedFieldName;
    } else {
      console.log(`🔍 SUMMARY: Could not resolve templated field "${fieldName}" - no summary row context found`);
      return;
    }
  }
  
  // Try different selectors to find the source element, prioritizing visible elements
  const selectors = [
    `input[name="${fieldName}"]:not([data-cd-repeat-template])`,
    `select[name="${fieldName}"]:not([data-cd-repeat-template])`,
    `textarea[name="${fieldName}"]:not([data-cd-repeat-template])`,
    `input[name="${fieldName}"]`,
    `select[name="${fieldName}"]`,
    `textarea[name="${fieldName}"]`,
    `input[id="${fieldName}"]`,
    `select[id="${fieldName}"]`,
    `textarea[id="${fieldName}"]`
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) continue;

    // Priority 1: Visible element with non-empty value
    for (const element of Array.from(elements)) {
      const htmlEl = element as HTMLElement;
      const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (htmlEl.offsetParent !== null && el.value && el.value.trim()) {
        sourceElement = el;
        console.log(`🔍 Found visible source WITH VALUE using selector: ${selector}, value="${el.value}"`);
        break;
      }
    }
    if (sourceElement) break;

    // Priority 2: Hidden element with non-empty value
    console.log(`🔍 No visible elements with values found, searching ${elements.length} hidden elements for one with a value...`);
    for (const element of Array.from(elements)) {
      const htmlEl = element as HTMLElement;
      const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (htmlEl.offsetParent === null && el.value && el.value.trim()) {
        sourceElement = el;
        console.log(`🔍 Found hidden source WITH VALUE using selector: ${selector}, value="${el.value}"`);
        break;
      }
    }
    if (sourceElement) break;

    // Priority 3: Any visible element (even if empty)
    for (const element of Array.from(elements)) {
      const htmlEl = element as HTMLElement;
      if (htmlEl.offsetParent !== null) {
        sourceElement = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        console.log(`🔍 Found visible source (empty value) using selector: ${selector}`);
        break;
      }
    }
    if (sourceElement) break;

    // Priority 4: First element as last resort
    sourceElement = elements[0] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    console.log(`🔍 Found source using first element (last resort): ${selector}`);
    break;
  }
  
  if (!sourceElement) {
    console.log(`🔍 SUMMARY: Direct match failed for field: "${fieldName}"`);
    
    // Debug: Log all available dynamic row input names with the new suffix pattern
    const allInputs = Array.from(document.querySelectorAll('input[name], select[name], textarea[name]'));
    const dynamicInputs = allInputs.filter(el => {
      const name = el.getAttribute('name');
      return name && name.includes('-'); // New pattern uses hyphens
    });
    const dynamicNames = dynamicInputs.map(el => el.getAttribute('name'));
    console.log(`🔍 SUMMARY: Available dynamic input names (with suffix pattern):`, dynamicNames);
    console.log(`🔍 SUMMARY: Looking for field name: "${fieldName}"`);
    
    return;
  }
  
  console.log(`🔍 SUMMARY: Found source element for "${fieldName}":`, sourceElement.tagName, sourceElement.type || '');
  
  // Get and set the current value
  let displayValue = '';
  
  // Debug: Log the actual input value and element details
  if (sourceElement.tagName.toLowerCase() === 'input' || sourceElement.tagName.toLowerCase() === 'textarea') {
    const inputEl = sourceElement as HTMLInputElement;
    console.log(`🔍 SUMMARY DEBUG: Input element value: "${inputEl.value}"`);
    console.log(`🔍 SUMMARY DEBUG: Input element name: "${inputEl.name}"`);
    console.log(`🔍 SUMMARY DEBUG: Input element id: "${inputEl.id}"`);
    console.log(`🔍 SUMMARY DEBUG: Element visibility: display="${inputEl.style.display}", parent visible="${inputEl.offsetParent !== null}"`);
    console.log(`🔍 SUMMARY DEBUG: Element classes: "${inputEl.className}"`);
    
    // Check if there are multiple elements with the same name
    const allWithSameName = document.querySelectorAll(`[name="${fieldName}"]`);
    console.log(`🔍 SUMMARY DEBUG: Found ${allWithSameName.length} elements with name="${fieldName}"`);
    if (allWithSameName.length > 1) {
      allWithSameName.forEach((el, idx) => {
        const htmlEl = el as HTMLElement;
        console.log(`🔍 SUMMARY DEBUG: Element ${idx + 1}: value="${(el as HTMLInputElement).value}", visible="${htmlEl.offsetParent !== null}", classes="${htmlEl.className}"`);
      });
    }
  }
  
  if (sourceElement.type === 'radio') {
    // For radio buttons, find the checked one
    const checkedRadio = document.querySelector(`input[name="${fieldName}"]:checked`) as HTMLInputElement;
    displayValue = checkedRadio ? checkedRadio.value : '';
  } else if (sourceElement.type === 'checkbox') {
    // For checkboxes, show checked state
    displayValue = (sourceElement as HTMLInputElement).checked ? 'Yes' : 'No';
  } else {
    // For regular inputs, selects, textareas
    displayValue = sourceElement.value;
  }
  
  // Update the summary element
  summaryElement.textContent = displayValue || '[Not specified]';
  console.log(`✅ SUMMARY: Updated summary for "${fieldName}": "${displayValue}" (empty: ${!displayValue})`);
  console.log(`   Summary element:`, summaryElement);
  console.log(`   Source element:`, sourceElement);

  // Add event listener for future changes if not already added
  if (!(sourceElement as any).__summaryListenerAdded) {
    const eventType = sourceElement.type === 'radio' || sourceElement.type === 'checkbox' ? 'change' : 'input';

    console.log(`🎧 SUMMARY: Adding ${eventType} listener for field "${fieldName}"...`);
    sourceElement.addEventListener(eventType, () => {
      console.log(`🔄 SUMMARY: *** FIELD INPUT EVENT FIRED *** Field "${fieldName}" changed to: "${sourceElement.value}"`);
      syncSummaryField(summaryElement, fieldName);
    });

    // For radio buttons, also listen to all radios with the same name
    if (sourceElement.type === 'radio') {
      const allRadios = document.querySelectorAll(`input[name="${fieldName}"]`);
      allRadios.forEach(radio => {
        if (!(radio as any).__summaryListenerAdded) {
          radio.addEventListener('change', () => {
            console.log(`🔄 SUMMARY: Radio "${fieldName}" changed, updating summary...`);
            syncSummaryField(summaryElement, fieldName);
          });
          (radio as any).__summaryListenerAdded = true;
        }
      });
    }

    (sourceElement as any).__summaryListenerAdded = true;
    console.log(`✅ SUMMARY: Event listener successfully added for field "${fieldName}"`);
  } else {
    console.log(`⏭️  SUMMARY: Event listener already exists for field "${fieldName}", skipping`);
  }
}

// Utility function to find row containing an element
function findRowContainingElement(group: DynamicRowGroup, element: Element): {row: Element, index: number} | null {
  for (let i = 0; i < group.rows.length; i++) {
    const row = group.rows[i];
    if (row.contains(element)) {
      return { row, index: i };
    }
  }
  return null;
}

function removeRow(group: DynamicRowGroup, targetRow: Element) {
  console.log(`➖ Removing row from group "${group.groupName}" (currently ${group.rows.length} rows)`);
  
  // Validate minimum row count - prevent removing last row
  if (group.rows.length <= 1) {
    console.warn('Cannot remove last row from group:', group.groupName);
    return;
  }
  
  // Find the target row index
  const targetIndex = group.rows.indexOf(targetRow);
  if (targetIndex === -1) {
    console.warn('Target row not found in group:', group.groupName);
    return;
  }
  
  console.log(`➖ Removing row at index ${targetIndex}`);
  
  // Remove the row from DOM
  targetRow.remove();
  
  // Remove from tracking array
  group.rows.splice(targetIndex, 1);
  
  // Re-enable the add button if we're under the limit
  if (group.rows.length < 5 && group.addButton) {
    (group.addButton as HTMLElement).style.opacity = '';
    (group.addButton as HTMLElement).style.pointerEvents = '';
    console.log(`✅ Add button re-enabled for group "${group.groupName}"`);
  }
  
  // Reindex remaining rows
  reindexRows(group);
  
  // Update summaries
  updateSummaries(group);
  
  console.log(`➖ Row removed successfully, new total: ${group.rows.length} rows`);
  
  // Dispatch event
  targetRow.dispatchEvent(new CustomEvent('cd:row:removed', {
    bubbles: true,
    detail: { groupName: group.groupName, rowIndex: targetIndex, removedRow: targetRow }
  }));
}

// Export function for reinitializing when containers become visible
function reinitializeDynamicRowGroup(groupName: string, container: Element) {
  initializeDynamicRowGroup(groupName, container);
}

// Tooltip System
// Provides accessible tooltips with smart positioning that works in both standard and split modes

interface TooltipParts {
  mode: 'standard' | 'split';
  comp: HTMLElement | null;
  panel: HTMLElement | null;
  pointer: HTMLElement | null;
}

const TOOLTIP_COMP_CLS = "tooltip_component";
const TOOLTIP_TRIG_CLS = "tooltip_element-wrapper";
const TOOLTIP_PANEL_CLS = "tooltip_tooltip-wrapper";
const TOOLTIP_PTR_CLS = "tooltip_pointer";

const flipSide: Record<string, string> = {
  bottom: "top",
  top: "bottom",
  left: "right",
  right: "left"
};

const axisMap: Record<string, {
  start: string;
  end: string;
  len: string;
  translate: string;
}> = {
  top:    { start: "left", end: "right", len: "width",  translate: "translateX" },
  bottom: { start: "left", end: "right", len: "width",  translate: "translateX" },
  left:   { start: "top",  end: "bottom", len: "height", translate: "translateY" },
  right:  { start: "top",  end: "bottom", len: "height", translate: "translateY" }
};

function findTooltipParts(trigger: HTMLElement): TooltipParts {
  const compAncestor = trigger.closest(`.${TOOLTIP_COMP_CLS}`) as HTMLElement;
  if (compAncestor) {
    // Standard Relume (icon or inline when whole component is inline)
    return {
      mode: "standard",
      comp: compAncestor,
      panel: compAncestor.querySelector(`.${TOOLTIP_PANEL_CLS}`) as HTMLElement,
      pointer: compAncestor.querySelector(`.${TOOLTIP_PTR_CLS}`) as HTMLElement
    };
  }

  // Split mode: trigger in label, component elsewhere, matched by data-tt
  const group = (trigger.closest("[data-tt-group]") || trigger.parentElement) as HTMLElement;
  const key = trigger.getAttribute("data-tt");
  const comp = key ? group.querySelector(`.${TOOLTIP_COMP_CLS}[data-tt-for="${key}"]`) as HTMLElement : null;

  return {
    mode: "split",
    comp,
    panel: comp?.querySelector(`.${TOOLTIP_PANEL_CLS}`) as HTMLElement,
    pointer: comp?.querySelector(`.${TOOLTIP_PTR_CLS}`) as HTMLElement
  };
}

function setupTooltipTrigger(trigger: HTMLElement) {
  if ((trigger as any).dataset._ttSetup) return;
  (trigger as any).dataset._ttSetup = "1";

  const parts = findTooltipParts(trigger);
  const { mode, comp, panel, pointer } = parts;
  if (!panel || !pointer) return;

  const baseSide =
    pointer.className.includes("is-left")   ? "left"  :
    pointer.className.includes("is-right")  ? "right" :
    pointer.className.includes("is-bottom") ? "bottom": "top";

  // Helper functions
  function show() {
    if (!panel) return;
    panel.style.display = "block";
    panel.style.opacity = "1";
  }

  function hide() {
    if (!panel) return;
    panel.style.opacity = "0";
    panel.style.display = "none";
  }

  let running = false;
  let hoverCount = 0;

  function tick() {
    if (!running || !panel || !pointer) return;
    requestAnimationFrame(tick);

    const tr = trigger.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // Choose side with space when possible
    const fits = {
      bottom: tr.bottom + pr.height < vh,
      top:    tr.top    - pr.height > 0,
      left:   tr.left   - pr.width  > 0,
      right:  tr.right  + pr.width  < vw
    };
    const side = fits[baseSide as keyof typeof fits] || !fits[flipSide[baseSide] as keyof typeof fits]
      ? baseSide
      : flipSide[baseSide];

    if (mode === "standard") {
      // Original relative logic (component & trigger together)
      const axis = axisMap[side];
      const opp = flipSide[side];

      // Center shift within viewport
      const trStart = tr[axis.start as keyof DOMRect] as number;
      const trEnd = tr[axis.end as keyof DOMRect] as number;
      const prLen = pr[axis.len as keyof DOMRect] as number;
      const midStart = (trStart + trEnd - prLen) / 2;
      const midEnd = (trStart + trEnd + prLen) / 2;
      let shift = 0;
      const rootLen = (side === "left" || side === "right") ? vh : vw;
      if (midStart < 0) shift = -midStart;
      else if (rootLen < midEnd) shift = rootLen - midEnd;

      panel.style.position = ""; // keep whatever your CSS sets (usually absolute)
      panel.style.transform = axis.translate + "(" + shift + "px)";
      pointer.style.transform = axis.translate + "(" + (-shift) + "px) rotate(45deg)";
      return;
    }

    // SPLIT MODE: position to viewport (fixed) using trigger's rect
    panel.style.position = "fixed";

    const GAP = 8; // space between trigger and panel
    let left = Math.round(tr.left + tr.width / 2 - pr.width / 2);
    let top = 0;

    if (side === "bottom") {
      top = Math.round(tr.bottom + GAP);
    } else if (side === "top") {
      top = Math.round(tr.top - GAP - pr.height);
    } else if (side === "left") {
      // vertical center
      top = Math.round(tr.top + tr.height / 2 - pr.height / 2);
      left = Math.round(tr.left - GAP - pr.width);
    } else { // right
      top = Math.round(tr.top + tr.height / 2 - pr.height / 2);
      left = Math.round(tr.right + GAP);
    }

    // Clamp horizontally/vertically into viewport
    const margin = 8;
    left = Math.max(margin, Math.min(left, vw - pr.width - margin));
    top = Math.max(margin, Math.min(top, vh - pr.height - margin));

    panel.style.left = left + "px";
    panel.style.top = top + "px";
    panel.style.right = "";
    panel.style.bottom = "";
    panel.style.transform = "none"; // fixed-position, no centering transform needed

    // Center pointer under the trigger's center (relative to panel)
    const triggerCenterX = tr.left + tr.width / 2;
    const panelCenterX = left + pr.width / 2;
    const dx = triggerCenterX - panelCenterX;

    if (side === "top" || side === "bottom") {
      pointer.style.transform = "translateX(" + dx + "px) rotate(45deg)";
    } else {
      // left/right: vertical pointer centering
      const triggerCenterY = tr.top + tr.height / 2;
      const panelCenterY = top + pr.height / 2;
      const dy = triggerCenterY - panelCenterY;
      pointer.style.transform = "translateY(" + dy + "px) rotate(45deg)";
    }
  }

  function start() {
    if (++hoverCount === 1) {
      show();
      running = true;
      tick();
    }
  }

  function stop() {
    if (hoverCount > 0 && --hoverCount === 0) {
      running = false;
      hide();
    }
  }

  trigger.addEventListener("mouseenter", start);
  trigger.addEventListener("mouseleave", stop);
  (comp || panel).addEventListener("mouseenter", start);
  (comp || panel).addEventListener("mouseleave", stop);

  trigger.setAttribute("tabindex", "0");
  trigger.addEventListener("focus", start);
  trigger.addEventListener("blur", stop);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Escape") stop();
  });
}

function initTooltips(form: HTMLFormElement) {
  debugLog('💬 Initializing tooltips for form...');
  const triggers = form.querySelectorAll(`.${TOOLTIP_TRIG_CLS}`);
  debugLog(`💬 Found ${triggers.length} tooltip triggers`);
  triggers.forEach((trigger) => setupTooltipTrigger(trigger as HTMLElement));
  infoLog(`✅ Tooltips initialized (${triggers.length} triggers)`);
}

function reinitializeTooltipsInRow(row: Element) {
  debugLog('💬 Reinitializing tooltips in new row...');
  const triggers = row.querySelectorAll(`.${TOOLTIP_TRIG_CLS}`);
  debugLog(`💬 Found ${triggers.length} tooltip triggers in row`);
  triggers.forEach((trigger) => setupTooltipTrigger(trigger as HTMLElement));
}

// Listen for visibility events to reinitialize hidden groups
document.addEventListener('form-wrapper-visibility:shown', (event) => {
  const visibleContainer = event.target as Element;
  const repeaterGroups = visibleContainer.querySelectorAll('[data-cd-repeat-group]');
  
  repeaterGroups.forEach((group) => {
    const groupName = group.getAttribute('data-cd-repeat-group');
    if (groupName) {
      reinitializeDynamicRowGroup(groupName, group);
    }
  });
});

// Branch-Based Summary Visibility (Tryformly Integration)
// This system detects when branch options are selected and persists the selection
// to show appropriate summary sections throughout the form flow

interface BranchSelection {
  [branchGroup: string]: string;
}

// Store selected branches in memory
const selectedBranches: BranchSelection = {};

function initBranchVisibility() {
  infoLog('🌿 Initializing Branch-Based Summary Visibility...');
  
  // Hide all elements with data-cd-summary-branch by default
  const branchSummaryElements = document.querySelectorAll('[data-cd-summary-branch]');
  debugLog(`🌿 Found ${branchSummaryElements.length} branch summary elements to hide by default`);
  
  branchSummaryElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.display = 'none';
    htmlElement.setAttribute('aria-hidden', 'true');
    debugLog(`🌿 Hidden branch summary ${index + 1}: ${htmlElement.tagName}.${htmlElement.className}`);
  });
  
  // Set up observer to watch for branch wrapper visibility changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target as HTMLElement;
        
        // Check if this is a branch wrapper with data-cd-branch
        if (target.matches('.step_wrapper[data-cd-branch]')) {
          handleBranchVisibilityChange();
        }
      }
    });
    
    // Also check for added/removed nodes that might be branch wrappers
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          const element = node as HTMLElement;
          if (element.matches && element.matches('.step_wrapper[data-cd-branch]')) {
            handleBranchVisibilityChange();
          }
        }
      });
    });
  });
  
  // Start observing the document for changes
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
    subtree: true
  });
  
  // Initial check for visible branch wrappers
  handleBranchVisibilityChange();
  
  // Update summary visibility based on any existing branch selections
  updateAllSummaryVisibility();
  
  infoLog('✅ Branch-based summary visibility initialization complete');
}

function handleBranchVisibilityChange() {
  debugLog('🌿 BRANCH: Checking branch wrapper visibility...');
  
  // Find all branch wrappers and check which ones are visible
  const allBranchWrappers = document.querySelectorAll('.step_wrapper[data-cd-branch]');
  
  allBranchWrappers.forEach((branchWrapper) => {
    const htmlElement = branchWrapper as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlElement);
    const isVisible = computedStyle.display !== 'none' && htmlElement.offsetParent !== null;
    
    if (isVisible) {
      const branchGroup = branchWrapper.getAttribute('data-cd-branch');
      const branchValue = branchWrapper.getAttribute('data-answer');
      
      if (branchGroup && branchValue) {
        // Record this branch selection
        selectedBranches[branchGroup] = branchValue;
        debugLog(`🌿 BRANCH: Selected ${branchGroup} = ${branchValue}`);
        
        // Update summary visibility immediately
        updateSummaryVisibilityForBranch(branchGroup, branchValue);
      }
    }
  });
}

function updateSummaryVisibilityForBranch(branchGroup: string, branchValue: string) {
  debugLog(`🌿 BRANCH: Updating summary visibility for ${branchGroup}:${branchValue}`);
  
  // Find all summary sections for this branch group
  const summaryElements = document.querySelectorAll(`[data-cd-summary-branch^="${branchGroup}:"]`);
  debugLog(`🌿 BRANCH: Found ${summaryElements.length} summary sections for branch group "${branchGroup}"`);
  
  summaryElements.forEach((element, index) => {
    const summaryBranchAttr = element.getAttribute('data-cd-summary-branch');
    const htmlElement = element as HTMLElement;
    
    if (!summaryBranchAttr) return;
    
    // Parse "branchGroup:branchValue" format
    const [summaryGroup, summaryValue] = summaryBranchAttr.split(':');
    const shouldShow = summaryGroup === branchGroup && summaryValue === branchValue;
    
    debugLog(`🌿 BRANCH: Section ${index + 1} (${summaryBranchAttr}): ${shouldShow ? 'SHOW' : 'HIDE'}`);
    
    if (shouldShow) {
      // Show the section
      htmlElement.style.display = '';
      htmlElement.removeAttribute('aria-hidden');
      
      // Make focusable elements accessible again
      const focusableElements = htmlElement.querySelectorAll('input, select, textarea, button, [tabindex]');
      focusableElements.forEach((el) => {
        (el as HTMLElement).removeAttribute('tabindex');
      });
      
      // Dispatch shown event
      element.dispatchEvent(new CustomEvent('cd:branch-summary:shown', { 
        bubbles: true, 
        detail: { branchGroup, branchValue, summaryBranchAttr } 
      }));
      
    } else if (summaryGroup === branchGroup) {
      // Hide sections from the same branch group that don't match
      htmlElement.style.display = 'none';
      htmlElement.setAttribute('aria-hidden', 'true');
      
      // Remove from tab order
      const focusableElements = htmlElement.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
      focusableElements.forEach((el) => {
        (el as HTMLElement).setAttribute('tabindex', '-1');
      });
      
      // Dispatch hidden event
      element.dispatchEvent(new CustomEvent('cd:branch-summary:hidden', { 
        bubbles: true, 
        detail: { branchGroup, branchValue, summaryBranchAttr } 
      }));
    }
  });
}

function updateAllSummaryVisibility() {
  debugLog('🌿 BRANCH: Updating all summary visibility based on selected branches');
  
  // Update summary visibility for all selected branches
  Object.entries(selectedBranches).forEach(([branchGroup, branchValue]) => {
    updateSummaryVisibilityForBranch(branchGroup, branchValue);
  });
}


function initializeLibrary() {

  const forms = document.querySelectorAll('form[data-cd-form="true"]');

  if (forms.length === 0) {
    return;
  }

  forms.forEach((form, index) => {
    const formElement = form as HTMLFormElement;

    try {
      // Initialize input formatting for inputs with data-input attribute
      initInputFormatting(formElement);

      // Initialize form wrapper visibility for elements with data-show-when
      initFormWrapperVisibility();

      // Initialize dynamic rows for repeatable sections
      initDynamicRows();

      // Initialize branch-based summary visibility
      initBranchVisibility();

      // Initialize tooltips for form
      initTooltips(formElement);

      // Summary field synchronization is handled within initDynamicRows()

      // Dispatch custom event for form enhancement completion
      formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));

    } catch (error) {
      console.error('❌ Error enhancing form:', error);
      if (error instanceof Error) {
        console.error('❌ Stack trace:', error.stack);
      }
    }
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLibrary);
} else {
  initializeLibrary();
}

// Global exposure for browser environments
(window as any).CDFormLibrary = {
  version: VERSION,
  initialize: initializeLibrary,
  dynamicRows: activeGroups
};