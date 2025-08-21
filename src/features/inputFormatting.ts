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

function autocorrectDate(value: string, pattern: string): { corrected: string; isValid: boolean } {
  const parts = value.split('/').map(p => p.padStart(2, '0'));
  let month = parseInt(parts[0] || '00', 10);
  let day = parseInt(parts[1] || '00', 10);
  let year = parts[2] || '';

  if (pattern === 'ddmmyyyy') [day, month] = [month, day]; // Swap for EU format

  month = Math.max(1, Math.min(12, month));
  day = Math.max(1, Math.min(31, day)); // Basic clamp; no month-specific max yet

  const isValid = year.length === 4 && day <= new Date(parseInt(year, 10), month, 0).getDate(); // Simple invalid check

  const formattedMonth = month.toString().padStart(2, '0');
  const formattedDay = day.toString().padStart(2, '0');

  let corrected = pattern === 'mmddyyyy'
    ? `${formattedMonth}/${formattedDay}/${year}`
    : `${formattedDay}/${formattedMonth}/${year}`;

  return { corrected, isValid: year.length === 4 && isValid };
}

function autocorrectTime(value: string, defaultMeridiem: 'AM' | 'PM'): { corrected: string; isValid: boolean } {
  const parts = value.split(/[: ]/);
  let hour = parseInt(parts[0] || '00', 10);
  let minute = parseInt(parts[1] || '00', 10);
  let meridiem = parts[2] || defaultMeridiem;

  hour = Math.max(1, Math.min(12, hour));
  minute = Math.max(0, Math.min(59, minute));

  const isValid = true; // Always valid after clamp for now

  const corrected = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${meridiem.toUpperCase()}`;
  return { corrected, isValid };
}

function preserveCaret(input: HTMLInputElement, oldValue: string, newValue: string, oldCaret: number) {
  // Simple mapping: count non-derived chars before oldCaret, place after same count in newValue
  const rawOld = oldValue.replace(/[^0-9a-zA-Z]/g, ''); // Strip derived
  const rawPos = rawOld.slice(0, oldCaret).length;

  let newPos = 0;
  let rawCount = 0;
  for (let i = 0; i < newValue.length; i++) {
    if (/[0-9a-zA-Z]/.test(newValue[i])) rawCount++;
    if (rawCount > rawPos) break;
    newPos = i + 1; // Place after the matching raw char
  }

  input.setSelectionRange(newPos, newPos);
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
      const { corrected, isValid } = config.type === 'date'
        ? autocorrectDate(input.value, config.pattern)
        : autocorrectTime(input.value, config.defaultMeridiem!);

      input.value = corrected;
      input.setAttribute('aria-invalid', (!isValid).toString());

      if (!isValid) {
        input.dispatchEvent(new CustomEvent('cd:inputformat:invalid', { bubbles: true }));
      }

      handleInput(new Event('input')); // Re-trigger format
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleInput);
    input.addEventListener('blur', handleBlur);

    // Initial format if value present
    if (input.value) handleInput(new Event('input'));
  });
}
