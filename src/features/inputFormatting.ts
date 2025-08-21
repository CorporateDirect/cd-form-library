// Input Formatting feature module
// Applies soft masking to inputs with data-input attribute (e.g., dates, times)
// Adheres to rules: natural editing, caret preservation, autocorrect on blur, events

type FormatType = 'date:mmddyyyy' | 'date:ddmmyyyy' | 'time:hhmm am' | 'time:hhmm pm';

interface FormatConfig {
  type: 'date' | 'time';
  pattern: string;
  defaultMeridiem?: 'AM' | 'PM';
}

function parseFormat(attr: string): FormatConfig | null {
  const normalized = attr.toLowerCase().trim().replace(/\s+/g, '');
  if (normalized === 'date:mmddyyyy') return { type: 'date', pattern: 'mmddyyyy' };
  if (normalized === 'date:ddmmyyyy') return { type: 'date', pattern: 'ddmmyyyy' };
  if (normalized === 'time:hhmmam') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'AM' };
  if (normalized === 'time:hhmmpm') return { type: 'time', pattern: 'hhmm', defaultMeridiem: 'PM' };
  return null;
}

function formatDate(raw: string, pattern: string): string {
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

function formatTime(raw: string, defaultMeridiem: 'AM' | 'PM'): string {
  const digits = raw.replace(/[^0-9apAP]/g, '').toUpperCase();
  const numPart = digits.replace(/[AP]/g, '').slice(0, 4);
  let meridiem = defaultMeridiem;
  if (digits.includes('A')) meridiem = 'AM';
  if (digits.includes('P')) meridiem = 'PM';

  let formatted = '';
  if (numPart.length >= 2) formatted += numPart.slice(0, 2) + ':';
  if (numPart.length > 2) formatted += numPart.slice(2);
  if (numPart.length >= 2) formatted += ' ' + meridiem;
  return formatted;
}

function autocorrectDate(value: string, pattern: string): string {
  // TODO: Implement clamping (e.g., month 01-12, day 01-31) on blur
  return value; // Placeholder
}

function autocorrectTime(value: string, defaultMeridiem: 'AM' | 'PM'): string {
  // TODO: Implement clamping (hour 01-12, minute 00-59) on blur
  return value; // Placeholder
}

function preserveCaret(input: HTMLInputElement, oldValue: string, newValue: string, oldCaret: number) {
  // TODO: Implement logical caret mapping (raw to formatted, skip derived chars)
  input.setSelectionRange(oldCaret, oldCaret); // Basic fallback
}

export function initInputFormatting(form: HTMLFormElement) {
  const inputs = form.querySelectorAll('input[data-input]');
  inputs.forEach((el) => {
    const input = el as HTMLInputElement;
    const attr = input.getAttribute('data-input');
    if (!attr) return;

    const config = parseFormat(attr);
    if (!config) return;

    input.dispatchEvent(new CustomEvent('cd:inputformat:bound', { bubbles: true }));

    const handleInput = (event: Event) => {
      const oldValue = input.value;
      const oldCaret = input.selectionStart || 0;

      let raw = input.value;
      let formatted: string;

      if (config.type === 'date') {
        formatted = formatDate(raw, config.pattern);
      } else {
        formatted = formatTime(raw, config.defaultMeridiem!);
      }

      input.value = formatted;
      preserveCaret(input, oldValue, formatted, oldCaret);

      input.dispatchEvent(new CustomEvent('cd:inputformat:changed', {
        bubbles: true,
        detail: { raw, formatted }
      }));
    };

    const handleBlur = () => {
      let corrected: string;
      if (config.type === 'date') {
        corrected = autocorrectDate(input.value, config.pattern);
      } else {
        corrected = autocorrectTime(input.value, config.defaultMeridiem!);
      }
      input.value = corrected;

      // TODO: Validate syntax and set aria-invalid if needed
      // if (invalid) input.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));

      handleInput(new Event('input')); // Re-trigger format
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleInput);
    input.addEventListener('blur', handleBlur);

    // Initial format if value present
    if (input.value) handleInput(new Event('input'));
  });
}
