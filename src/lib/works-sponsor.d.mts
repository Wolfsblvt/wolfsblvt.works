/** Build-time integration facts admitted by the shared Works sponsor component. */
export interface WorksSponsorOptions {
  idPrefix: string;
  heading?: number;
  context?: string;
  github?: string;
  kofi?: string;
}

/** Render trusted Works template bytes with escaped host text and enabled HTTPS destinations. */
export function renderWorksSponsor(template: string, options: WorksSponsorOptions): string;
