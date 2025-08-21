// Standalone CD Form Library - No modules, pure JavaScript
// This bypasses all module system issues

(function() {
  'use strict';
  
  console.log('🚀 CD Form Library v0.1.12 - Standalone version executing!');
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
    
    // Load Maskito first, then apply to inputs
    loadMaskito().then(() => {
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

        // Get Maskito configuration
        const maskitoConfig = getMaskitoConfig(config);
        if (!maskitoConfig) {
          console.log(`🚀 Input ${index + 1} - no Maskito config available, skipping`);
          return;
        }

        try {
          // Apply Maskito mask to the input
          const maskedInput = new window.Maskito(input, maskitoConfig);
          console.log(`🚀 Input ${index + 1} - Maskito mask applied successfully`);
          
          // Store the mask instance for potential cleanup
          input._maskitoInstance = maskedInput;
          
        } catch (error) {
          console.error(`🚀 Input ${index + 1} - Failed to apply Maskito mask:`, error);
        }
      });
    }).catch((error) => {
      console.error('🚀 Failed to load Maskito, falling back to no formatting:', error);
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