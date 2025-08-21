// Input Formatting feature module
// Applies Maskito-based formatting to inputs with data-input attribute
// Supports: date:mmddyyyy, date:ddmmyyyy, time:hhmm am, time:hhmm pm

import { Maskito } from '@maskito/core';
import { maskitoDateOptionsGenerator, maskitoTimeOptionsGenerator } from '@maskito/kit';

interface FormatConfig {
  type: 'date' | 'time';
  pattern: string;
  defaultMeridiem?: 'AM' | 'PM';
}

export function parseFormat(attr: string): FormatConfig | null {
  const normalized = attr.toLowerCase().trim().replace(/\s+/g, ' ');
  
  if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
  if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
  if (normalized === 'time:hhmm am' || normalized === 'time:hhmm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
  if (normalized === 'time:hhmm pm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
  
  return null;
}

export function createMaskitoOptions(config: FormatConfig) {
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

export function initInputFormatting(form: HTMLFormElement) {
  const inputs = form.querySelectorAll('input[data-input]');
  
  inputs.forEach((el) => {
    const input = el as HTMLInputElement;
    const attr = input.getAttribute('data-input');
    
    if (!attr) return;

    const config = parseFormat(attr);
    if (!config) return;

    const maskitoOptions = createMaskitoOptions(config);
    if (!maskitoOptions) return;
    
    // Initialize Maskito on the input
    const maskito = new Maskito(input, maskitoOptions);
    
    // Dispatch bound event
    input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

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