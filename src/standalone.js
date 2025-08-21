// Standalone CD Form Library - No modules, pure JavaScript
// This bypasses all module system issues

(function() {
  'use strict';
  
  console.log('🚀 CD Form Library v0.1.10 - Standalone version executing!');
  console.log('🚀 Document state:', document.readyState);
  console.log('🚀 Window object:', typeof window);

  // Load Maskito library dynamically
  function loadMaskito() {
    return new Promise((resolve, reject) => {
      if (window.Maskito) {
        console.log('🚀 Maskito already loaded');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@maskito/core@latest/dist/index.umd.js';
      script.onload = () => {
        console.log('🚀 Maskito loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('🚀 Failed to load Maskito');
        reject(new Error('Failed to load Maskito'));
      };
      document.head.appendChild(script);
    });
  }

  // Input formatting functions
  function parseFormat(attr) {
    const normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
    if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
    if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
    if (normalized === 'time:hhmm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
    return null;
  }

  // Maskito configuration for different input types
  function getMaskitoConfig(config) {
    if (config.type === 'date') {
      if (config.pattern === 'mmddyyyy') {
        return {
          mask: [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/],
          guide: false,
          keepCharPositions: true
        };
      } else { // ddmmyyyy
        return {
          mask: [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/],
          guide: false,
          keepCharPositions: true
        };
      }
    } else if (config.type === 'time') {
      return {
        mask: [/\d/, /\d/, ':', /\d/, /\d/, ' ', /[AP]/, 'M'],
        guide: false,
        keepCharPositions: true,
        pipe: function(conformedValue) {
          // Auto-convert single digits to proper format
          let value = conformedValue;
          
          // Handle AM/PM detection
          if (value.includes('A') && !value.includes('AM')) {
            value = value.replace('A', 'AM');
          } else if (value.includes('P') && !value.includes('PM')) {
            value = value.replace('P', 'PM');
          }
          
          return value;
        }
      };
    }
    return null;
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
