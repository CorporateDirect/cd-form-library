// Browser-specific build for cd-form-library
// This will be compiled to a simple IIFE for direct browser use

import { Maskito } from '@maskito/core';
import { maskitoDateOptionsGenerator, maskitoTimeOptionsGenerator } from '@maskito/kit';

const VERSION = '0.1.23';

interface FormatConfig {
  type: 'date' | 'time';
  pattern: string;
  defaultMeridiem?: 'AM' | 'PM';
}

function parseFormat(attr: string): FormatConfig | null {
  console.log('🔧 parseFormat called with attr:', JSON.stringify(attr));
  const normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
  console.log('🔧 normalized attr:', JSON.stringify(normalized));
  
  if (normalized === 'date:mmddyyyy') {
    console.log('🔧 Matched date:mmddyyyy');
    return { type: 'date', pattern: 'mmddyyyy' };
  }
  if (normalized === 'date:ddmmyyyy') {
    console.log('🔧 Matched date:ddmmyyyy');
    return { type: 'date', pattern: 'ddmmyyyy' };
  }
  if (normalized === 'time:hhmm am' || normalized === 'time:hhmm') {
    console.log('🔧 Matched time:hhmm am');
    return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
  }
  if (normalized === 'time:hhmm pm') {
    console.log('🔧 Matched time:hhmm pm');
    return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
  }
  
  console.log('🔧 No format match found for:', JSON.stringify(normalized));
  return null;
}

function createMaskitoOptions(config: FormatConfig) {
  if (config.type === 'date') {
    const mode = config.pattern === 'mmddyyyy' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
    return maskitoDateOptionsGenerator({
      mode,
      separator: '/'
    });
  } else if (config.type === 'time') {
    return maskitoTimeOptionsGenerator({
      mode: 'HH:MM AA'
    });
  }
  return null;
}

function initInputFormatting(form: HTMLFormElement) {
  console.log('🔧 initInputFormatting called for form:', form);
  const inputs = form.querySelectorAll('input[data-input]');
  console.log(`🔧 Found ${inputs.length} inputs with data-input attribute`);
  
  inputs.forEach((el, index) => {
    const input = el as HTMLInputElement;
    const attr = input.getAttribute('data-input');
    console.log(`🔧 Input ${index + 1}:`, input, 'data-input value:', attr);
    
    if (!attr) {
      console.log(`🔧 Input ${index + 1} has no data-input attribute, skipping`);
      return;
    }

    const config = parseFormat(attr);
    console.log(`🔧 Input ${index + 1} parsed config:`, config);
    if (!config) {
      console.log(`🔧 Input ${index + 1} config parsing failed for attr:`, attr);
      return;
    }

    const maskitoOptions = createMaskitoOptions(config);
    console.log(`🔧 Input ${index + 1} maskito options:`, maskitoOptions);
    if (!maskitoOptions) {
      console.log(`🔧 Input ${index + 1} failed to create Maskito options`);
      return;
    }
    
    // Initialize Maskito on the input
    console.log(`🔧 Input ${index + 1} initializing Maskito...`);
    const maskito = new Maskito(input, maskitoOptions);
    console.log(`🔧 Input ${index + 1} Maskito initialized successfully:`, maskito);
    
    // Dispatch bound event
    input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));
    console.log(`🔧 Input ${index + 1} bound event dispatched`);

    // Track changes for event dispatch
    let previousValue = input.value;
    
    input.addEventListener('input', () => {
      const newValue = input.value;
      if (newValue !== previousValue) {
        input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
          bubbles: true,
          detail: { raw: previousValue, formatted: newValue }
        }));
        previousValue = newValue;
      }
    });

    input.addEventListener('blur', () => {
      const isValid = input.value.length === 0 || input.checkValidity();
      input.setAttribute('aria-invalid', (!isValid).toString());

      if (!isValid) {
        input.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
      }
    });

    // Store maskito instance for cleanup if needed
    (input as any).__maskito = maskito;
  });
}

function initFormWrapperVisibility() {
  // Placeholder for form wrapper visibility - will implement if needed
  console.log('🔧 initFormWrapperVisibility called');
}

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
(window as any).CDFormLibrary = {
  version: VERSION,
  initialize: initializeLibrary
};

console.log('🚀 CDFormLibrary exposed on window object');