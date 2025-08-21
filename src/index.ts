// CD Form Library - Entry point
// Auto-initializes on DOMContentLoaded per Webflow rules

import { initInputFormatting } from './features/inputFormatting';
import { initFormWrapperVisibility } from './features/formWrapperVisibility';

const VERSION = '0.1.21';

function initializeLibrary() {
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  
  forms.forEach((form) => {
    const formElement = form as HTMLFormElement;
    
    // Initialize input formatting for inputs with data-input attribute
    initInputFormatting(formElement);
    
    // Initialize form wrapper visibility for elements with data-show-when
    initFormWrapperVisibility();
    
    // Dispatch custom event for form enhancement completion
    formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLibrary);
} else {
  initializeLibrary();
}

// Global exposure for browser environments
if (typeof window !== 'undefined') {
  (window as any).CDFormLibrary = {
    version: VERSION,
    initialize: initializeLibrary
  };
}

export { initializeLibrary };