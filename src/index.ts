// Entry point for the library
// Auto-initializes on DOMContentLoaded

// Immediate debug log to confirm script execution
console.log('🚀 CD Form Library v0.1.5 - Script executing!');
console.log('🚀 Document state:', document.readyState);
console.log('🚀 Window object:', typeof window);

try {
  console.log('🚀 Attempting to import features...');
  const { initFormEnhancements, initInputFormatting } = require('./features');
  console.log('🚀 Features imported successfully');

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
        initFormEnhancements(form as HTMLFormElement);
        initInputFormatting(form as HTMLFormElement);
        console.log(`🚀 Form ${index + 1} enhanced successfully`);
      } catch (error) {
        console.error(`🚀 Error enhancing form ${index + 1}:`, error);
      }
    });
    
    console.log(`🚀 Enhanced ${forms.length} forms.`);
  }

  // Auto-init on page load
  console.log('🚀 Setting up initialization...');

  if (document.readyState === 'loading') {
    console.log('🚀 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeLibrary);
  } else {
    console.log('🚀 Document ready, initializing immediately...');
    initializeLibrary();
  }

  // Also try to initialize after a delay as backup
  setTimeout(() => {
    console.log('🚀 Backup initialization after 2 seconds...');
    initializeLibrary();
  }, 2000);

} catch (error) {
  console.error('🚀 Error in CD Form Library:', error);
}
