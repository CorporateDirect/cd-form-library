// Form Wrapper Visibility feature module
// Manages conditional visibility of form wrappers based on data-show-when attribute
// Format: data-show-when="<group>=<value>"

export function initFormWrapperVisibility() {
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