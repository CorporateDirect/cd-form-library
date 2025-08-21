// Entry point for the library
// Auto-initializes on DOMContentLoaded

import { initInputFormatting, parseFormat, createMaskitoOptions } from './features/inputFormatting';
import { Maskito } from '@maskito/core';

// Get version from package.json - will be replaced during build
const VERSION = '0.1.18';

// Immediate debug log to confirm script execution
console.log(`🚀 CD Form Library v${VERSION} - Script executing!`);
console.log('🚀 Document state:', document.readyState);
console.log('🚀 Window object:', typeof window);

function initializeLibrary() {
  console.log('🚀 CD Form Library initializing...');
  console.log('🚀 Document ready state:', document.readyState);
  
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  console.log(`🚀 Found ${forms.length} forms with data-cd-form="true"`);
  
  if (forms.length === 0) {
    console.log('🚀 No forms found - checking all forms on page...');
    const allForms = document.querySelectorAll('form');
    console.log(`🚀 Total forms on page: ${allForms.length}`);
    allForms.forEach((form, i) => {
      console.log(`🚀 Form ${i + 1}:`, form, 'data-cd-form:', form.getAttribute('data-cd-form'));
    });
  }
  
  forms.forEach((form, index) => {
    console.log(`🚀 Processing form ${index + 1}:`, form);
    try {
      initInputFormatting(form as HTMLFormElement);
      console.log(`🚀 Form ${index + 1} enhanced successfully`);
    } catch (error) {
      console.error(`🚀 Error enhancing form ${index + 1}:`, error);
    }
  });
  
  console.log(`🚀 Enhanced ${forms.length} forms.`);
}

// Auto-init on page load
console.log('\uD83D\uDE80 Setting up initialization...');

if (document.readyState === 'loading') {
  console.log('\uD83D\uDE80 Document still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeLibrary);
} else {
  console.log('\uD83D\uDE80 Document ready, initializing immediately...');
  initializeLibrary();
}

// Also try to initialize after a delay as backup
setTimeout(() => {
  console.log('\uD83D\uDE80 Backup initialization after 2 seconds...');
  initializeLibrary();
}, 2000);

// Export for manual initialization if needed
export { initializeLibrary, initInputFormatting };

// Define the applyMaskToInput function
function applyMaskToInput(el: HTMLInputElement) {
  const attr = el.getAttribute('data-input');
  if (!attr) return;

  const config = parseFormat(attr);
  if (!config) return;

  const maskitoOptions = createMaskitoOptions(config);
  if (!maskitoOptions) return;

  const maskito = new Maskito(el, maskitoOptions);
  el.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

  el.addEventListener('input', () => {
    const newValue = el.value;
    el.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
      bubbles: true,
      detail: { raw: el.value, formatted: newValue }
    }));
  });

  el.addEventListener('blur', () => {
    const isValid = el.value.length === 0 || el.checkValidity();
    el.setAttribute('aria-invalid', (!isValid).toString());

    if (!isValid) {
      el.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
    }
  });

  (el as any).__maskito = maskito;
}

// Define the FormLib object
const FormLib = {
  initMasks(opts?: any) {
    const inputs = document.querySelectorAll('input[data-input], textarea[data-input]');
    inputs.forEach((input) => {
      applyMaskToInput(input as HTMLInputElement);
    });

    // Observe for dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const newInputs = node.querySelectorAll('input[data-input], textarea[data-input]');
            newInputs.forEach((input) => {
              applyMaskToInput(input as HTMLInputElement);
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },

  applyMaskToInput(el: HTMLInputElement) {
    const attr = el.getAttribute('data-input');
    if (!attr) return;

    const config = parseFormat(attr);
    if (!config) return;

    const maskitoOptions = createMaskitoOptions(config);
    if (!maskitoOptions) return;

    const maskito = new Maskito(el, maskitoOptions);
    el.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

    el.addEventListener('input', () => {
      const newValue = el.value;
      el.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
        bubbles: true,
        detail: { raw: el.value, formatted: newValue }
      }));
    });

    el.addEventListener('blur', () => {
      const isValid = el.value.length === 0 || el.checkValidity();
      el.setAttribute('aria-invalid', (!isValid).toString());

      if (!isValid) {
        el.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
      }
    });

    (el as any).__maskito = maskito;
  }
};

// Expose FormLib globally
if (typeof window !== 'undefined') {
  (window as any).FormLib = FormLib;
}

// Global exposure for browser environments
if (typeof window !== 'undefined') {
  (window as any).CDFormLibrary = {
    version: VERSION,
    initialize: initializeLibrary,
    features: {
      initInputFormatting
    }
  };
  console.log('\uD83D\uDE80 CDFormLibrary exposed on window object');
}
