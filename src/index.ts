// Entry point for the library
// Auto-initializes on DOMContentLoaded

import { initFormEnhancements } from './features'; // To be implemented

function initializeLibrary() {
  console.log('CD Form Library initializing...');
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  forms.forEach(form => {
    initFormEnhancements(form as HTMLFormElement);
    initInputFormatting(form as HTMLFormElement); // Add input formatting
  });
  console.log(`Enhanced ${forms.length} forms.`);
}

// Auto-init on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLibrary);
} else {
  initializeLibrary();
}

export { initializeLibrary }; // For manual init if needed
