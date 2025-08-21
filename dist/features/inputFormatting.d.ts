interface FormatConfig {
    type: 'date' | 'time';
    pattern: string;
    defaultMeridiem?: 'AM' | 'PM';
}
export declare function parseFormat(attr: string): FormatConfig | null;
export declare function createMaskitoOptions(config: FormatConfig): Required<import("@maskito/core").MaskitoOptions> | null;
export declare function initInputFormatting(form: HTMLFormElement): void;
export {};
