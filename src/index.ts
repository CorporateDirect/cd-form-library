// CD Form Library - Entry point
// Auto-initializes on DOMContentLoaded per Webflow rules

import { initInputFormatting } from './features/inputFormatting';
import { initFormWrapperVisibility } from './features/formWrapperVisibility';

const VERSION = '0.1.27';

function initializeLibrary() {
  console.log('🚀 CD Form Library v' + VERSION + ' initializing...');
  console.log('🚀 Document ready state:', document.readyState);
  
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  console.log(`🚀 Found ${forms.length} forms with data-cd-form="true"`);
  
  if (forms.length === 0) {
    console.log('🚀 No CD forms found, checking all forms on page...');
    const allForms = document.querySelectorAll('form');
    console.log(`🚀 Total forms on page: ${allForms.length}`);
    allForms.forEach((form, i) => {
      console.log(`🚀 Form ${i + 1}:`, form, 'data-cd-form:', form.getAttribute('data-cd-form'));
    });
  }
  
  forms.forEach((form, index) => {
    const formElement = form as HTMLFormElement;
    console.log(`🚀 Processing form ${index + 1}:`, formElement);
    
    try {
      // Initialize input formatting for inputs with data-input attribute
      initInputFormatting(formElement);
      
      // Initialize form wrapper visibility for elements with data-show-when
      initFormWrapperVisibility();
      
      // Dispatch custom event for form enhancement completion
      formElement.dispatchEvent(new CustomEvent('cdForm:validated', { bubbles: true }));
      console.log(`🚀 Form ${index + 1} enhanced successfully`);
    } catch (error) {
      console.error(`🚀 Error enhancing form ${index + 1}:`, error);
    }
  });
  
  console.log(`🚀 Library initialization complete - enhanced ${forms.length} forms`);
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