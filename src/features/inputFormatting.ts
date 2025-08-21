// Input Formatting feature module
// Applies soft masking to inputs with data-input attribute (e.g., dates, times)
// Adheres to rules: natural editing, caret preservation, autocorrect on blur, events
// Uses Maskito library for robust input formatting

import { Maskito } from '@maskito/core';
import { maskitoDateOptionsGenerator, maskitoTimeOptionsGenerator } from '@maskito/kit';

type FormatType = 'date:mmddyyyy' | 'date:ddmmyyyy' | 'time:hhmm';

interface FormatConfig {
  type: 'date' | 'time';
  pattern: string;
  defaultMeridiem?: 'AM' | 'PM';
}

function parseFormat(attr: string): FormatConfig | null {
  const normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
  if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
  if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
  if (normalized === 'time:hhmm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
  return null;
}

function createMaskitoOptions(config: FormatConfig) {
  if (config.type === 'date') {
    // Configure Maskito for date formatting
    const mode = config.pattern === 'mmddyyyy' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
    return maskitoDateOptionsGenerator({
      mode,
      separator: '/'
    });
  } else if (config.type === 'time') {
    // Configure Maskito for time formatting
    return maskitoTimeOptionsGenerator({
      mode: 'HH:MM AA'
    });
  }
  return null;
}

export { parseFormat, createMaskitoOptions };

export function initInputFormatting(form: HTMLFormElement) {
  console.log('initInputFormatting called for form:', form);
  
  const inputs = form.querySelectorAll('input[data-input]');
  console.log(`Found ${inputs.length} inputs with data-input attribute`);
  
  inputs.forEach((el, index) => {
    const input = el as HTMLInputElement;
    const attr = input.getAttribute('data-input');
    console.log(`Input ${index + 1}:`, input, 'data-input value:', attr);
    
    if (!attr) {
      console.log(`Input ${index + 1} has no data-input attribute, skipping`);
      return;
    }

    const config = parseFormat(attr);
    console.log(`Input ${index + 1} parsed config:`, config);
    
    if (!config) {
      console.log(`Input ${index + 1} config parsing failed, skipping`);
      return;
    }

    // Create Maskito options for this input type
    const maskitoOptions = createMaskitoOptions(config);
    if (!maskitoOptions) {
      console.log(`Input ${index + 1} failed to create Maskito options, skipping`);
      return;
    }

    console.log(`Input ${index + 1} successfully configured for formatting:`, config);
    
    // Initialize Maskito on the input
    const maskito = new Maskito(input, maskitoOptions);
    
    // Dispatch bound event
    input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

    // Add custom event listeners for our library events
    const originalValue = input.value;
    
    input.addEventListener('input', () => {
      const newValue = input.value;
      if (newValue !== originalValue) {
        input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
          bubbles: true,
          detail: { raw: originalValue, formatted: newValue }
        }));
      }
    });

    input.addEventListener('blur', () => {
      // Maskito handles validation, we just need to check if it's valid
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
