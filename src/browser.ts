// Browser-specific build for cd-form-library
// This will be compiled to a simple IIFE for direct browser use

import { Maskito } from '@maskito/core';
import { maskitoDateOptionsGenerator, maskitoTimeOptionsGenerator } from '@maskito/kit';

const VERSION = '0.1.66';

interface FormatConfig {
  type: 'date' | 'time';
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
  }
  return null;
}

function initInputFormatting(form: HTMLFormElement) {
  const inputs = form.querySelectorAll('input[data-input]');
  
  inputs.forEach((el) => {
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
  
  wrappers.forEach((wrapper) => {
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
  const repeaterGroups = document.querySelectorAll('[data-cd-repeat-group]');
  
  repeaterGroups.forEach((container) => {
    const groupName = container.getAttribute('data-cd-repeat-group');
    if (!groupName) return;
    
    // Skip if container is hidden (will be reinitialized when shown)
    if (window.getComputedStyle(container).display === 'none') {
      return;
    }
    
    initializeDynamicRowGroup(groupName, container);
  });
}

function initializeDynamicRowGroup(groupName: string, container: Element) {
  // Find template row and add button
  const template = container.querySelector('[data-cd-repeat-template]');
  const addButton = container.querySelector('[data-cd-add-row]');
  const namePattern = container.getAttribute('data-cd-name-pattern') || `${groupName}[{i}]`;
  
  if (!template) return;
  
  // Get existing rows
  const existingRows = Array.from(container.querySelectorAll('[data-cd-repeat-row]'));
  
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
    // Remove any existing listeners
    addButton.removeEventListener('click', handleAddRow);
    addButton.addEventListener('click', handleAddRow);
  }
  
  // Reindex existing rows
  reindexRows(group);
  
  // Update summaries
  updateSummaries(group);
}

function handleAddRow(event: Event) {
  event.preventDefault();
  const button = event.target as Element;
  const container = button.closest('[data-cd-repeat-group]');
  if (!container) return;
  
  const groupName = container.getAttribute('data-cd-repeat-group');
  if (!groupName) return;
  
  const group = activeGroups.get(groupName);
  if (!group) return;
  
  addNewRow(group);
}

function addNewRow(group: DynamicRowGroup) {
  // Clone the template
  const newRow = group.template.cloneNode(true) as Element;
  
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
}

function updateSummaries(group: DynamicRowGroup) {
  // Find summary containers for this group
  const summaryContainers = document.querySelectorAll(`[data-summary-for="${group.groupName}"]`);
  
  summaryContainers.forEach((summaryContainer) => {
    const template = summaryContainer.querySelector('[data-summary-template]');
    if (!template) return;
    
    // Remove existing summary rows
    const existingSummaryRows = summaryContainer.querySelectorAll('[data-summary-row]');
    existingSummaryRows.forEach(row => row.remove());
    
    // Create summary rows for each data row
    group.rows.forEach((dataRow, index) => {
      const rowIndex = index + 1;
      const summaryRow = template.cloneNode(true) as Element;
      
      // Mark as summary row instead of template
      summaryRow.removeAttribute('data-summary-template');
      summaryRow.setAttribute('data-summary-row', '');
      
      // Update data-input-field attributes
      const fieldElements = summaryRow.querySelectorAll('[data-input-field]');
      fieldElements.forEach((element) => {
        const fieldPattern = element.getAttribute('data-input-field');
        if (fieldPattern) {
          const finalFieldName = fieldPattern.replace('{i}', rowIndex.toString());
          element.setAttribute('data-input-field', finalFieldName);
        }
      });
      
      // Insert the summary row
      summaryContainer.appendChild(summaryRow);
    });
  });
  
  // Trigger TryFormly refresh if available
  if (typeof (window as any).TryFormly?.refresh === 'function') {
    (window as any).TryFormly.refresh();
  }
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
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  
  forms.forEach((form) => {
    const formElement = form as HTMLFormElement;
    
    try {
      // Initialize input formatting for inputs with data-input attribute
      initInputFormatting(formElement);
      
      // Initialize form wrapper visibility for elements with data-show-when
      initFormWrapperVisibility();
      
      // Initialize dynamic rows for repeatable sections
      initDynamicRows();
      
      // Dispatch custom event for form enhancement completion
      formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
    } catch (error) {
      console.error('Error enhancing form:', error);
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
  initialize: initializeLibrary
};