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
    
    if (digits.length === 0) return '';
    
    if (pattern === 'mmddyyyy') {
      // Month (1-2 digits)
      if (digits.length >= 1) {
        formatted += digits.slice(0, Math.min(2, digits.length));
      }
      // Add slash after month if we have day digits
      if (digits.length >= 3) {
        formatted += '/';
        // Day (3-4 digits become positions 1-2 after slash)
        formatted += digits.slice(2, Math.min(4, digits.length));
      }
      // Add slash after day if we have year digits  
      if (digits.length >= 5) {
        formatted += '/';
        // Year (5+ digits)
        formatted += digits.slice(4);
      }
    } else { // ddmmyyyy - same logic
      if (digits.length >= 1) {
        formatted += digits.slice(0, Math.min(2, digits.length));
      }
      if (digits.length >= 3) {
        formatted += '/';
        formatted += digits.slice(2, Math.min(4, digits.length));
      }
      if (digits.length >= 5) {
        formatted += '/';
        formatted += digits.slice(4);
      }
    }
    return formatted;
  }

  function formatTime(raw, defaultMeridiem) {
    const cleaned = raw.toUpperCase();
    
    // Extract digits and meridiem separately
    const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 4);
    
    // Look for A, P, AM, PM anywhere in the string
    let meridiem = defaultMeridiem;
    if (cleaned.includes('A')) {
      meridiem = 'AM';
    } else if (cleaned.includes('P')) {
      meridiem = 'PM';
    }
    
    if (digits.length === 0) return '';
    
    let formatted = '';
    
    // Hour (1-2 digits)
    if (digits.length >= 1) {
      formatted += digits.slice(0, Math.min(2, digits.length));
    }
    
    // Add colon and minutes if we have minute digits
    if (digits.length >= 3) {
      formatted += ':';
      formatted += digits.slice(2, Math.min(4, digits.length));
    }
    
    // Add meridiem if we have at least hour
    if (digits.length >= 1) {
      formatted += ' ' + meridiem;
    }
    
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

      let formatTimer;
      let isFormatting = false; // Flag to prevent recursive formatting
      
      const handleInput = function(event) {
        // Skip if we're currently formatting to prevent recursion
        if (isFormatting) {
          console.log('🚀 Skipping input event - currently formatting');
          return;
        }
        
        console.log(`🚀 Input event triggered for ${config.type} field:`, input);
        
        // Clear any existing timer
        if (formatTimer) {
          clearTimeout(formatTimer);
        }
        
        // Set a short delay before formatting to avoid interfering with typing
        formatTimer = setTimeout(() => {
          const oldValue = input.value;
          const caretPos = input.selectionStart;
          console.log('🚀 Formatting after delay - old value:', oldValue, 'caret:', caretPos);

          let raw = input.value;
          let formatted;

          if (config.type === 'date') {
            formatted = formatDate(raw, config.pattern);
            console.log('🚀 Date formatting - raw:', raw, 'formatted:', formatted);
          } else {
            formatted = formatTime(raw, config.defaultMeridiem);
            console.log('🚀 Time formatting - raw:', raw, 'formatted:', formatted);
          }

          // Only update if the formatted value is different
          if (formatted !== oldValue) {
            isFormatting = true; // Set flag before changing value
            input.value = formatted;
            
            // Try to preserve caret position
            const newCaretPos = Math.min(caretPos, formatted.length);
            input.setSelectionRange(newCaretPos, newCaretPos);
            
            console.log('🚀 Value updated to:', formatted, 'new caret:', newCaretPos);
            
            // Clear flag after a brief delay to allow the input event to complete
            setTimeout(() => {
              isFormatting = false;
            }, 10);
          }
        }, 300); // 300ms delay
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
