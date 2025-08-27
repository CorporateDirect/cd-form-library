// Browser-specific build for cd-form-library
// This will be compiled to a simple IIFE for direct browser use

import { Maskito } from '@maskito/core';
import { maskitoDateOptionsGenerator, maskitoTimeOptionsGenerator } from '@maskito/kit';

const VERSION = '0.1.86';

interface FormatConfig {
  type: 'date' | 'time' | 'percent';
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
    return maskitoTimeOptionsGenerator({
      mode: 'HH:MM AA'
    });
  } else if (config.type === 'percent') {
    // Simple percent mask: numbers + optional decimal + %
    return {
      mask: /^\d{0,3}(\.\d{0,2})?%?$/,
      preprocessors: [
        ({ elementState, data }) => {
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
        ({ value, selection }) => {
          // Add % if not present and value has content
          if (value && !value.endsWith('%')) {
            return {
              value: value + '%',
              selection: [selection[0], selection[1]]
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
  console.log(`📝 Found ${inputs.length} inputs with data-input attributes`);
  
  inputs.forEach((el, index) => {
    const input = el as HTMLInputElement;
    const attr = input.getAttribute('data-input');
    
    console.log(`📝 Input ${index + 1}: ${input.id || input.name} - data-input="${attr}"`);
    
    if (!attr) return;

    const config = parseFormat(attr);
    console.log(`📝 Config for ${input.id}:`, config);
    if (!config) return;

    const maskitoOptions = createMaskitoOptions(config);
    console.log(`📝 Maskito options created for ${input.id}:`, !!maskitoOptions);
    if (!maskitoOptions) return;
    
    // Initialize Maskito on the input
    const maskito = new Maskito(input, maskitoOptions);
    console.log(`✅ Maskito initialized for ${input.id}`);
    
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
  console.log(`👁️ Found ${wrappers.length} elements with data-show-when`);
  
  // Track all input groups that wrappers are listening to
  const groupListeners = new Map<string, Set<Element>>();
  
  wrappers.forEach((wrapper, index) => {
    const condition = wrapper.getAttribute('data-show-when');
    if (!condition) return;
    
    const [group, value] = condition.split('=').map(s => s.trim());
    if (!group || value === undefined) return;
    
    console.log(`👁️ Wrapper ${index + 1}: "${condition}" - Looking for input group "${group}" with value "${value}"`);
    
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
  console.log(`🔍 Checking visibility for group "${group}": found ${inputs.length} inputs`);
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
  console.log(`👁️ Group "${group}": current="${currentValue}", target="${targetValue}", shouldShow=${shouldShow}`);
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
  console.log('\n🔄 === DYNAMIC ROWS INITIALIZATION ===');
  
  const repeaterGroups = document.querySelectorAll('[data-cd-repeat-group]');
  console.log('🔍 Found repeat groups:', repeaterGroups.length);
  
  if (repeaterGroups.length === 0) {
    console.warn('⚠️ No elements found with data-cd-repeat-group attribute');
    // Check for any elements that might be close
    const possibleGroups = document.querySelectorAll('[data*="repeat"], [data*="cd-repeat"]');
    console.log('🔍 Found elements with "repeat" in attributes:', possibleGroups.length);
    if (possibleGroups.length > 0) {
      console.log('🔍 First possible group:', possibleGroups[0]);
      console.log('🔍 Its attributes:', Array.from(possibleGroups[0].attributes).map(attr => `${attr.name}="${attr.value}"`));
    }
    return;
  }
  
  repeaterGroups.forEach((container, index) => {
    console.log(`\n🎯 Processing Group ${index + 1}:`);
    console.log('🔍 Container element:', container.tagName, container.className);
    
    const groupName = container.getAttribute('data-cd-repeat-group');
    console.log('🔍 Group name:', groupName);
    
    if (!groupName) {
      console.error('❌ No group name found, skipping');
      return;
    }
    
    // Skip if container is hidden (will be reinitialized when shown)
    const computedStyle = window.getComputedStyle(container);
    const isHidden = computedStyle.display === 'none';
    console.log('🔍 Container display style:', computedStyle.display);
    console.log('🔍 Is hidden?', isHidden);
    
    if (isHidden) {
      console.log('⏭️ Skipping hidden container (will reinitialize when shown)');
      return;
    }
    
    console.log('✅ Proceeding to initialize group:', groupName);
    initializeDynamicRowGroup(groupName, container);
  });
  
  console.log('\n🏁 Dynamic rows initialization complete');
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
      for (const btn of allButtons) {
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
  
  const namePattern = container.getAttribute('data-cd-name-pattern') || `${groupName}[{i}]`;
  
  console.log(`\n🔧 === INITIALIZING GROUP: "${groupName}" ===`);
  console.log('🔍 Container:', container.tagName, container.className);
  console.log('🔍 Template found:', !!template);
  console.log('🔍 Add button found:', !!addButton);
  
  if (addButton) {
    console.log('🔍 Add button details:', {
      tag: addButton.tagName,
      class: addButton.className,
      'data-cd-repeat-add': addButton.getAttribute('data-cd-repeat-add'),
      'data-cd-add-row': addButton.getAttribute('data-cd-add-row'),
      href: addButton.getAttribute('href')
    });
  } else {
    console.log('❌ Add button search failed. Detailed debugging:');
    
    // Check inside container
    const addRowBtn = container.querySelector('[data-cd-add-row]');
    const addRepeatBtn = container.querySelector(`[data-cd-repeat-add="${groupName}"]`);
    console.log('🔍 Inside container [data-cd-add-row]:', !!addRowBtn);
    console.log('🔍 Inside container [data-cd-repeat-add="' + groupName + '"]:', !!addRepeatBtn);
    
    // Check in parent
    const parentAddRepeat = container.parentElement?.querySelector(`[data-cd-repeat-add="${groupName}"]`);
    const parentAddRow = container.parentElement?.querySelector('[data-cd-add-row]');
    console.log('🔍 In parent [data-cd-repeat-add="' + groupName + '"]:', !!parentAddRepeat);
    console.log('🔍 In parent [data-cd-add-row]:', !!parentAddRow);
    
    // Check in document
    const docAddRepeat = document.querySelector(`[data-cd-repeat-add="${groupName}"]`);
    console.log('🔍 In document [data-cd-repeat-add="' + groupName + '"]:', !!docAddRepeat);
    
    // Check all buttons in document
    const allAddButtons = document.querySelectorAll('[data-cd-add-row], [data-cd-repeat-add]');
    console.log('🔍 Total add buttons in document:', allAddButtons.length);
    
    if (allAddButtons.length > 0) {
      console.log('🔍 All add buttons found:');
      allAddButtons.forEach((btn, i) => {
        console.log(`  ${i + 1}. ${btn.tagName} - data-cd-repeat-add: "${btn.getAttribute('data-cd-repeat-add')}" - data-cd-add-row: "${btn.getAttribute('data-cd-add-row')}" - text: "${btn.textContent?.trim()}"`);
      });
    }
    
    // Show container parent structure for debugging
    console.log('🔍 Container parent structure:');
    console.log('  Container:', container.tagName, container.className);
    console.log('  Parent:', container.parentElement?.tagName, container.parentElement?.className);
    console.log('  Grandparent:', container.parentElement?.parentElement?.tagName, container.parentElement?.parentElement?.className);
  }
  
  // If no template exists, create one from the first existing row
  if (!template) {
    console.log('🔍 No template found, searching for existing rows...');
    const firstRow = container.querySelector('[data-cd-repeat-row]');
    console.log('🔍 First existing row found:', !!firstRow);
    
    if (firstRow) {
      console.log('🔍 First row details:', {
        tag: firstRow.tagName,
        class: firstRow.className,
        'data-cd-repeat-row': firstRow.getAttribute('data-cd-repeat-row')
      });
      
      template = firstRow.cloneNode(true) as Element;
      template.setAttribute('data-cd-repeat-template', '');
      
      // Clear input values in template
      const inputs = template.querySelectorAll('input, select, textarea');
      console.log('🔍 Clearing', inputs.length, 'input values in template');
      inputs.forEach((input) => {
        (input as HTMLInputElement).value = '';
      });
      
      container.insertBefore(template, firstRow);
      console.log(`✅ Created template from first row for group "${groupName}"`);
    } else {
      console.log('🔍 Searching for any elements that might be rows...');
      const possibleRows = container.querySelectorAll('[data*="repeat-row"], [data*="cd-repeat"]');
      console.log('🔍 Found possible rows:', possibleRows.length);
      if (possibleRows.length > 0) {
        console.log('🔍 First possible row:', possibleRows[0]);
        console.log('🔍 Its attributes:', Array.from(possibleRows[0].attributes).map(attr => `${attr.name}="${attr.value}"`));
      }
    }
  } else {
    console.log('✅ Template found:', template.tagName, template.className);
  }
  
  if (!template) {
    console.error('❌ No template available, cannot initialize group');
    return;
  }

  // Hide the template
  console.log('🔍 Hiding template...');
  (template as HTMLElement).style.display = 'none';
  
  // Get existing rows
  const existingRows = Array.from(container.querySelectorAll('[data-cd-repeat-row]'));
  console.log('🔍 Found existing rows:', existingRows.length);
  
  existingRows.forEach((row, index) => {
    console.log(`🔍 Existing row ${index + 1}:`, {
      tag: row.tagName,
      class: row.className,
      'data-cd-repeat-row': row.getAttribute('data-cd-repeat-row')
    });
  });
  
  // Ensure at least one row is visible (first non-template row)
  const nonTemplateRows = existingRows.filter(row => !row.hasAttribute('data-cd-repeat-template'));
  if (nonTemplateRows.length > 0) {
    const firstRow = nonTemplateRows[0] as HTMLElement;
    if (firstRow.style.display === 'none') {
      console.log('🔍 Making first row visible...');
      firstRow.style.display = '';
      firstRow.removeAttribute('aria-hidden');
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
  
  // Reindex existing rows
  reindexRows(group);
  
  // Update summaries
  updateSummaries(group);
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
  
  // Clone the first visible row instead of the template
  const firstVisibleRow = Array.from(group.container.querySelectorAll('[data-cd-repeat-row]:not([data-cd-repeat-template])'))
    .find(row => (row as HTMLElement).style.display !== 'none');
  
  if (!firstVisibleRow) {
    console.error('❌ No visible row found to clone');
    return;
  }
  
  const newRow = firstVisibleRow.cloneNode(true) as Element;
  
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
  
  // Ensure the new row is visible
  const htmlRow = newRow as HTMLElement;
  htmlRow.style.display = '';
  htmlRow.removeAttribute('aria-hidden');
  console.log(`➕ New row visibility: display="${htmlRow.style.display}"`);
  
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
  
  // Reindex all rows
  reindexRows(group);
  
  // Update summaries
  updateSummaries(group);
  
  console.log(`➕ Row added successfully, new total: ${group.rows.length} rows`);
  
  // Dispatch event
  newRow.dispatchEvent(new CustomEvent('cd:row:added', {
    bubbles: true,
    detail: { groupName: group.groupName, rowIndex: group.rows.length - 1 }
  }));
}

function reindexRows(group: DynamicRowGroup) {
  group.rows.forEach((row, index) => {
    const rowIndex = index + 1; // 1-based indexing
    
    // Update input names
    const inputs = row.querySelectorAll('[data-repeat-name]');
    inputs.forEach((input) => {
      const fieldName = input.getAttribute('data-repeat-name');
      if (fieldName) {
        const finalName = group.namePattern
          .replace('{i}', rowIndex.toString())
          .replace('{field}', fieldName);
        (input as HTMLInputElement).name = finalName;
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
  group.rows.forEach((row) => {
    const inputs = row.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  
  // Sync summary fields after reindexing
  syncAllSummaryFields();
}

function updateSummaries(group: DynamicRowGroup) {
  console.log(`📊 Updating summaries for group "${group.groupName}" (${group.rows.length} rows)`);
  
  // Find summary containers for this group
  const summaryContainers = document.querySelectorAll(`[data-summary-for="${group.groupName}"]`);
  console.log(`📊 Found ${summaryContainers.length} summary container(s) for group "${group.groupName}"`);
  
  summaryContainers.forEach((summaryContainer, containerIndex) => {
    const template = summaryContainer.querySelector('[data-summary-template]');
    if (!template) {
      console.warn(`📊 No template found in summary container ${containerIndex} for group "${group.groupName}"`);
      return;
    }
    
    // Remove existing summary rows
    const existingSummaryRows = summaryContainer.querySelectorAll('[data-summary-row]');
    console.log(`📊 Removing ${existingSummaryRows.length} existing summary rows from container ${containerIndex}`);
    existingSummaryRows.forEach(row => row.remove());
    
    // Create summary rows for each data row
    console.log(`📊 Creating ${group.rows.length} new summary rows for container ${containerIndex}`);
    group.rows.forEach((dataRow, index) => {
      const rowIndex = index + 1;
      const summaryRow = template.cloneNode(true) as Element;
      
      // Mark as summary row instead of template
      summaryRow.removeAttribute('data-summary-template');
      summaryRow.setAttribute('data-summary-row', '');
      
      // Update data-input-field attributes
      const fieldElements = summaryRow.querySelectorAll('[data-input-field]');
      console.log(`📊 Processing ${fieldElements.length} field elements in summary row ${rowIndex}`);
      fieldElements.forEach((element) => {
        const fieldPattern = element.getAttribute('data-input-field');
        if (fieldPattern) {
          const finalFieldName = fieldPattern.replace('{i}', rowIndex.toString());
          element.setAttribute('data-input-field', finalFieldName);
          console.log(`📊 Updated field: ${fieldPattern} → ${finalFieldName}`);
        }
      });
      
      // Insert the summary row
      summaryContainer.appendChild(summaryRow);
    });
  });
  
  // Sync field values after creating summary rows
  syncAllSummaryFields();
  
  // Trigger TryFormly refresh if available
  if (typeof (window as any).TryFormly?.refresh === 'function') {
    console.log('📊 Triggering TryFormly.refresh()');
    (window as any).TryFormly.refresh();
  } else {
    console.log('📊 TryFormly.refresh() not available');
  }
}

// Summary field synchronization functions
function syncAllSummaryFields() {
  console.log('🔄 Syncing all summary fields...');
  
  // Find all summary output elements
  const summaryElements = document.querySelectorAll('[data-cd-input-field]');
  console.log(`🔄 Found ${summaryElements.length} summary field elements`);
  
  summaryElements.forEach((summaryElement, index) => {
    const fieldName = summaryElement.getAttribute('data-cd-input-field');
    if (!fieldName) return;
    
    console.log(`🔄 Syncing field ${index + 1}: "${fieldName}"`);
    syncSummaryField(summaryElement as HTMLElement, fieldName);
  });
}

function syncSummaryField(summaryElement: HTMLElement, fieldName: string) {
  // Find the corresponding input/select/textarea element
  let sourceElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;
  
  console.log(`🔍 Syncing summary field: "${fieldName}"`);
  
  // Check if this is a templated field name with {i} placeholder
  if (fieldName.includes('{i}')) {
    console.log(`🔍 Templated field detected: "${fieldName}"`);
    
    // Extract the row number from the summary element's context
    const summaryRow = summaryElement.closest('[data-summary-row]');
    if (summaryRow) {
      // Find all summary rows in the same container to determine the index
      const summaryContainer = summaryRow.parentElement;
      const allSummaryRows = Array.from(summaryContainer?.querySelectorAll('[data-summary-row]') || []);
      const rowIndex = allSummaryRows.indexOf(summaryRow) + 1; // 1-based indexing
      
      // Replace {i} with the actual row index
      const resolvedFieldName = fieldName.replace('{i}', rowIndex.toString());
      console.log(`🔍 Resolved templated field: "${fieldName}" → "${resolvedFieldName}"`);
      
      // Use the resolved field name for lookup
      fieldName = resolvedFieldName;
    } else {
      console.log(`🔍 Could not resolve templated field "${fieldName}" - no summary row context found`);
      return;
    }
  }
  
  // Try different selectors to find the source element
  const selectors = [
    `input[name="${fieldName}"]`,
    `select[name="${fieldName}"]`, 
    `textarea[name="${fieldName}"]`,
    `input[id="${fieldName}"]`,
    `select[id="${fieldName}"]`,
    `textarea[id="${fieldName}"]`
  ];
  
  for (const selector of selectors) {
    sourceElement = document.querySelector(selector);
    if (sourceElement) {
      console.log(`🔍 Found source using selector: ${selector}`);
      break;
    }
  }
  
  if (!sourceElement) {
    console.log(`🔍 Direct match failed for field: "${fieldName}"`);
    
    // Debug: Log a few available input names to understand the pattern
    const allInputs = Array.from(document.querySelectorAll('input[name], select[name], textarea[name]'));
    const sampleNames = allInputs.slice(0, 5).map(el => el.getAttribute('name'));
    console.log(`🔍 Sample available input names:`, sampleNames);
    
    return;
  }
  
  console.log(`🔍 Found source element for "${fieldName}":`, sourceElement.tagName, sourceElement.type || '');
  
  // Get and set the current value
  let displayValue = '';
  
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
  console.log(`✅ Updated summary for "${fieldName}": "${displayValue}"`);
  
  // Add event listener for future changes if not already added
  if (!(sourceElement as any).__summaryListenerAdded) {
    const eventType = sourceElement.type === 'radio' || sourceElement.type === 'checkbox' ? 'change' : 'input';
    
    sourceElement.addEventListener(eventType, () => {
      console.log(`🔄 Field "${fieldName}" changed, updating summary...`);
      syncSummaryField(summaryElement, fieldName);
    });
    
    // For radio buttons, also listen to all radios with the same name
    if (sourceElement.type === 'radio') {
      const allRadios = document.querySelectorAll(`input[name="${fieldName}"]`);
      allRadios.forEach(radio => {
        if (!(radio as any).__summaryListenerAdded) {
          radio.addEventListener('change', () => {
            console.log(`🔄 Radio "${fieldName}" changed, updating summary...`);
            syncSummaryField(summaryElement, fieldName);
          });
          (radio as any).__summaryListenerAdded = true;
        }
      });
    }
    
    (sourceElement as any).__summaryListenerAdded = true;
    console.log(`🎧 Added ${eventType} listener for field "${fieldName}"`);
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

function initializeLibrary() {
  console.log('🚀 CDFormLibrary Initialize Starting...');
  console.log('🔍 VERSION:', VERSION);
  console.log('🔍 DOM Ready State:', document.readyState);
  console.log('🔍 Document Title:', document.title);
  console.log('🔍 Current URL:', window.location.href);
  
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  console.log('🔍 Found forms with data-cd-form="true":', forms.length);
  
  if (forms.length === 0) {
    console.warn('⚠️ No forms found with data-cd-form="true"');
    const allForms = document.querySelectorAll('form');
    console.log('🔍 Total forms on page:', allForms.length);
    if (allForms.length > 0) {
      console.log('🔍 First form element:', allForms[0]);
      console.log('🔍 First form attributes:', Array.from(allForms[0].attributes).map(attr => `${attr.name}="${attr.value}"`));
    }
    return;
  }
  
  forms.forEach((form, index) => {
    const formElement = form as HTMLFormElement;
    console.log(`\n📋 Processing Form ${index + 1}:`, formElement);
    console.log(`📋 Form ID:`, formElement.id || 'NO ID');
    console.log(`📋 Form Classes:`, formElement.className || 'NO CLASSES');
    
    try {
      // Initialize input formatting for inputs with data-input attribute
      console.log('🎯 Step 1: Initializing input formatting...');
      initInputFormatting(formElement);
      
      // Initialize form wrapper visibility for elements with data-show-when
      console.log('🎯 Step 2: Initializing form wrapper visibility...');
      initFormWrapperVisibility();
      
      // Initialize dynamic rows for repeatable sections
      console.log('🎯 Step 3: Initializing dynamic rows...');
      initDynamicRows();
      
      // Initialize summary field synchronization
      console.log('🎯 Step 4: Initializing summary field synchronization...');
      syncAllSummaryFields();
      
      // Dispatch custom event for form enhancement completion
      console.log('🎯 Step 5: Dispatching validation event...');
      formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
      
      console.log('✅ Form initialization completed successfully');
    } catch (error) {
      console.error('❌ Error enhancing form:', error);
      console.error('❌ Stack trace:', error.stack);
    }
  });
  
  console.log('🏁 CDFormLibrary Initialize Complete');
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
  initialize: initializeLibrary
};