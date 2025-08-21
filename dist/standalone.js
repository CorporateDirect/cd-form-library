// Standalone CD Form Library - No modules, pure JavaScript
// This bypasses all module system issues

(function() {
  'use strict';
  
  console.log('🚀 CD Form Library v0.1.12 - Standalone version executing!');
  console.log('🚀 Document state:', document.readyState);
  console.log('🚀 Window object:', typeof window);

  // Simple, reliable input masking (no external dependencies)
  function applyInputMask(input, config) {
    console.log(`🚀 Applying mask to input:`, input, 'config:', config);
    
    let isUpdating = false;
    
    function formatValue(value) {
      if (config.type === 'date') {
        // Extract only digits
        const digits = value.replace(/\D/g, '').slice(0, 8);
        let formatted = '';
        
        if (digits.length >= 1) {
          formatted += digits.slice(0, Math.min(2, digits.length));
        }
        if (digits.length >= 3) {
          formatted += '/' + digits.slice(2, Math.min(4, digits.length));
        }
        if (digits.length >= 5) {
          formatted += '/' + digits.slice(4);
        }
        
        return formatted;
      } else if (config.type === 'time') {
        // Extract digits and letters
        const cleaned = value.toUpperCase();
        const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 4);
        
        // Detect AM/PM
        let meridiem = config.defaultMeridiem || 'AM';
        if (cleaned.includes('A')) {
          meridiem = 'AM';
        } else if (cleaned.includes('P')) {
          meridiem = 'PM';
        }
        
        let formatted = '';
        if (digits.length >= 1) {
          formatted += digits.slice(0, Math.min(2, digits.length));
        }
        if (digits.length >= 3) {
          formatted += ':' + digits.slice(2);
        }
        if (digits.length >= 1) {
          formatted += ' ' + meridiem;
        }
        
        return formatted;
      }
      return value;
    }
    
    function handleInput(event) {
      if (isUpdating) return;
      
      const oldValue = input.value;
      const caretPos = input.selectionStart;
      const formatted = formatValue(oldValue);
      
      if (formatted !== oldValue) {
        isUpdating = true;
        input.value = formatted;
        
        // Preserve caret position
        const newCaretPos = Math.min(caretPos + (formatted.length - oldValue.length), formatted.length);
        input.setSelectionRange(newCaretPos, newCaretPos);
        
        setTimeout(() => {
          isUpdating = false;
        }, 10);
        
        console.log(`🚀 Formatted: "${oldValue}" → "${formatted}"`);
      }
    }
    
    // Add event listeners
    input.addEventListener('input', handleInput);
    input.addEventListener('paste', handleInput);
    
    // Format initial value if present
    if (input.value) {
      handleInput();
    }
    
    return true;
  }

  // Input formatting functions
  function parseFormat(attr) {
    const normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
    if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
    if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
    if (normalized === 'time:hhmm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
    return null;
  }

  // No external configuration needed - built-in masking

  function initInputFormatting(form) {
    console.log('🚀 initInputFormatting called for form:', form);
    
    const inputs = form.querySelectorAll('input[data-input]');
    console.log(`🚀 Found ${inputs.length} inputs with data-input attribute`);
    
    // Apply built-in masking to inputs
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

      try {
        // Apply built-in mask to the input
        const success = applyInputMask(input, config);
        if (success) {
          console.log(`🚀 Input ${index + 1} - Built-in mask applied successfully`);
        }
      } catch (error) {
        console.error(`🚀 Input ${index + 1} - Failed to apply mask:`, error);
      }
    });
  }

  function initFormEnhancements(form) {
    console.log('🚀 initFormEnhancements called for form:', form);
    // Initialize input formatting
    initInputFormatting(form);
  }

  function initializeLibrary() {
    console.log('🚀 CD Form Library initializing...');
    console.log('🚀 Document ready state:', document.readyState);
    
    try {
      const forms = document.querySelectorAll('form[data-cd-form="true"]');
      console.log(`🚀 Found ${forms.length} forms with data-cd-form="true"`);
      
      forms.forEach(function(form, index) {
        console.log(`🚀 Processing form ${index + 1}:`, form);
        initFormEnhancements(form);
        console.log(`🚀 Form ${index + 1} enhanced successfully`);
      });
      
      console.log(`🚀 Enhanced ${forms.length} forms.`);
    } catch (error) {
      console.error('🚀 Error during library initialization:', error);
    }
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