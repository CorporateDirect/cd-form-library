// Standalone CD Form Library - No modules, pure JavaScript
// This bypasses all module system issues

(function() {
  'use strict';
  
  console.log('🚀 CD Form Library v0.1.6 - Standalone version executing!');
  console.log('🚀 Document state:', document.readyState);
  console.log('🚀 Window object:', typeof window);

  // Input formatting functions
  function parseFormat(attr) {
    const normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
    if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
    if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
    if (normalized === 'time:hhmm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
    return null;
  }

  function formatDate(raw, pattern) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (pattern === 'mmddyyyy') {
      if (digits.length >= 2) formatted += digits.slice(0, 2) + '/';
      if (digits.length >= 4) formatted += digits.slice(2, 4) + '/';
      if (digits.length > 4) formatted += digits.slice(4);
    } else { // ddmmyyyy
      if (digits.length >= 2) formatted += digits.slice(0, 2) + '/';
      if (digits.length >= 4) formatted += digits.slice(2, 4) + '/';
      if (digits.length > 4) formatted += digits.slice(4);
    }
    return formatted;
  }

  function formatTime(raw, defaultMeridiem) {
    const cleaned = raw.toUpperCase().replace(/[^0-9AP]/g, '');
    const numPart = cleaned.replace(/[AP]/g, '').slice(0, 4);
    const meridiemMatch = cleaned.match(/[AP]+$/);
    let meridiem = meridiemMatch ? (meridiemMatch[0].startsWith('A') ? 'AM' : 'PM') : defaultMeridiem;

    let formatted = '';
    if (numPart.length >= 2) formatted += numPart.slice(0, 2) + ':';
    if (numPart.length > 2) formatted += numPart.slice(2);
    if (numPart.length >= 2) formatted += ' ' + meridiem;
    return formatted;
  }

  function initInputFormatting(form) {
    console.log('🚀 initInputFormatting called for form:', form);
    
    const inputs = form.querySelectorAll('input[data-input]');
    console.log(`🚀 Found ${inputs.length} inputs with data-input attribute`);
    
    inputs.forEach(function(input, index) {
      const attr = input.getAttribute('data-input');
      console.log(`🚀 Input ${index + 1}:`, input, 'data-input value:', attr);
      
      if (!attr) {
        console.log(`🚀 Input ${index + 1} has no data-input attribute, skipping`);
        return;
      }

      const config = parseFormat(attr);
      console.log(`🚀 Input ${index + 1} parsed config:`, config);
      
      if (!config) {
        console.log(`🚀 Input ${index + 1} config parsing failed, skipping`);
        return;
      }

      console.log(`🚀 Input ${index + 1} successfully configured for formatting:`, config);

      const handleInput = function(event) {
        console.log(`🚀 Input event triggered for ${config.type} field:`, input);
        
        const oldValue = input.value;
        console.log('🚀 Old value:', oldValue);

        let raw = input.value;
        let formatted;

        if (config.type === 'date') {
          formatted = formatDate(raw, config.pattern);
          console.log('🚀 Date formatting - raw:', raw, 'formatted:', formatted);
        } else {
          formatted = formatTime(raw, config.defaultMeridiem);
          console.log('🚀 Time formatting - raw:', raw, 'formatted:', formatted);
        }

        input.value = formatted;
        console.log('🚀 Final value set:', input.value);
      };

      input.addEventListener('input', handleInput);
      input.addEventListener('change', handleInput);
      
      // Initial format if value present
      if (input.value) handleInput();
    });
  }

  function initializeLibrary() {
    console.log('🚀 CD Form Library initializing...');
    console.log('🚀 Document ready state:', document.readyState);
    
    const forms = document.querySelectorAll('form[data-cd-form="true"]');
    console.log(`🚀 Found ${forms.length} forms with data-cd-form="true"`);
    
    if (forms.length === 0) {
      console.log('🚀 No forms found - checking all forms on page...');
      const allForms = document.querySelectorAll('form');
      console.log(`🚀 Total forms on page: ${allForms.length}`);
      allForms.forEach(function(form, i) {
        console.log(`🚀 Form ${i + 1}:`, form, 'data-cd-form:', form.getAttribute('data-cd-form'));
      });
    }
    
    forms.forEach(function(form, index) {
      console.log(`🚀 Processing form ${index + 1}:`, form);
      try {
        initInputFormatting(form);
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
  setTimeout(function() {
    console.log('🚀 Backup initialization after 2 seconds...');
    initializeLibrary();
  }, 2000);

})();
