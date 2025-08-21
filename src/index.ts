// Entry point for the library
// Auto-initializes on DOMContentLoaded

import { initFormEnhancements, initInputFormatting } from './features'; // Updated import

function initializeLibrary() {
  console.log('CD Form Library initializing...');
  console.log('Document ready state:', document.readyState);
  
  const forms = document.querySelectorAll('form[data-cd-form="true"]');
  console.log(`Found ${forms.length} forms with data-cd-form="true"`);
  
  forms.forEach((form, index) => {
    console.log(`Processing form ${index + 1}:`, form);
    initFormEnhancements(form as HTMLFormElement);
    initInputFormatting(form as HTMLFormElement);
  });
  
  console.log(`Enhanced ${forms.length} forms.`);
}

// Auto-init on page load
console.log('CD Form Library script loaded! Document state:', document.readyState);

if (document.readyState === 'loading') {
  console.log('Document still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeLibrary);
} else {
  console.log('Document ready, initializing immediately...');
  initializeLibrary();
}

// Also try to initialize after a delay as backup
setTimeout(() => {
  console.log('Backup initialization after 2 seconds...');
  initializeLibrary();
}, 2000);

export { initializeLibrary }; // For manual init if needed
