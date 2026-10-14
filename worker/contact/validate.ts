/**
 * Server-side validation of a contact submission. Preserves safe input, rejects control characters and
 * header-injection material in single-line fields, and never trusts the client's own checks.
 */
import { FIELDS, LIMITS, findCategory, findProduct, type CategoryValue, type ProductSlug } from '../../shared/contact-contract';

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidSubmission {
  category: CategoryValue;
  categoryLabel: string;
  product: ProductSlug | null;
  productLabel: string | null;
  name: string | null;
  email: string;
  subject: string;
  message: string;
}

export type ValidationResult = { ok: true; value: ValidSubmission } | { ok: false; errors: FieldError[] };

// Anything below U+0020 except tab/newline, plus DEL and the C1 range, plus Unicode line separators.
const CONTROL_IN_TEXT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u2028\u2029]/;
const CONTROL_IN_LINE = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/;
// Deliberately simple: one local part, one domain with a dot and a plausible label. Deliverability is the
// visitor copy's job, not a regular expression's.
const EMAIL = /^[^\s@<>"'(),;:\\[\]]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/i;

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

function length(value: string): number {
  return [...value].length;
}

export function validateSubmission(form: FormData): ValidationResult {
  const errors: FieldError[] = [];

  const category = findCategory(text(form, FIELDS.category).trim());
  if (!category) errors.push({ field: FIELDS.category, message: 'Choose what the message is about.' });

  // Unknown product values are ignored, not errors: the parameter is a convenience, not user input to echo.
  const product = findProduct(text(form, FIELDS.product).trim());

  const rawName = text(form, FIELDS.name).trim();
  let name: string | null = rawName || null;
  if (name && CONTROL_IN_LINE.test(name)) {
    errors.push({ field: FIELDS.name, message: 'The name must be a single line of text.' });
    name = null;
  } else if (name && length(name) > LIMITS.nameMax) {
    errors.push({ field: FIELDS.name, message: `Keep the name to ${LIMITS.nameMax} characters.` });
  }

  const email = text(form, FIELDS.email).trim();
  if (!email) errors.push({ field: FIELDS.email, message: 'Enter the email address replies should go to.' });
  else if (length(email) > LIMITS.emailMax || CONTROL_IN_LINE.test(email) || !EMAIL.test(email)) {
    errors.push({ field: FIELDS.email, message: 'Enter a valid email address.' });
  }

  const subject = text(form, FIELDS.subject).trim();
  if (!subject) errors.push({ field: FIELDS.subject, message: 'Enter a subject.' });
  else if (CONTROL_IN_LINE.test(subject)) errors.push({ field: FIELDS.subject, message: 'The subject must be a single line of text.' });
  else if (length(subject) > LIMITS.subjectMax) {
    errors.push({ field: FIELDS.subject, message: `Keep the subject to ${LIMITS.subjectMax} characters.` });
  }

  const message = text(form, FIELDS.message).replace(/\r\n?/g, '\n').trim();
  if (!message) errors.push({ field: FIELDS.message, message: 'Write a message.' });
  else if (CONTROL_IN_TEXT.test(message)) {
    errors.push({ field: FIELDS.message, message: 'The message contains characters that cannot be sent as text.' });
  } else if (length(message) > LIMITS.messageMax) {
    errors.push({
      field: FIELDS.message,
      message: `This message is longer than the form can carry (${LIMITS.messageMax.toLocaleString('en')} characters). Send it by email instead.`,
    });
  }

  if (errors.length > 0 || !category) return { ok: false, errors };

  return {
    ok: true,
    value: {
      category: category.value,
      categoryLabel: category.label,
      product: product?.slug ?? null,
      productLabel: product?.label ?? null,
      name,
      email,
      subject,
      message,
    },
  };
}
