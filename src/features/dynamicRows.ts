// Dynamic Rows feature module
// Manages repeatable form sections based on data-cd-repeat-group attribute

export interface DynamicRowGroup {
  groupName: string;
  container: Element;
  template: Element;
  namePattern: string;
  rows: Element[];
  addButton: Element | null;
}

const activeGroups = new Map<string, DynamicRowGroup>();

export function initDynamicRows() {
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

export function initializeDynamicRowGroup(groupName: string, container: Element) {
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
export function reinitializeDynamicRowGroup(groupName: string, container: Element) {
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