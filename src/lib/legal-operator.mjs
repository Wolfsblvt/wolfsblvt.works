// The legal operator (name, postal address, legal contacts) for Impressum and Privacy and data. Public source carries
// only the obvious fixture in src/data/legal-operator.example.json. A production build receives the private canonical
// record as the WOLFSBLVT_LEGAL_OPERATOR_B64 projection, decoded here in build context only: never logged, never sent
// to client JavaScript, never written back to Git. Adapted from the Leitsatz website starter.
import fixture from '../data/legal-operator.example.json' with { type: 'json' };

export function loadLegalOperator({ requireProduction = false } = {}) {
  const encoded = process.env.WOLFSBLVT_LEGAL_OPERATOR_B64;
  if (!encoded) {
    if (requireProduction) throw new Error('WOLFSBLVT_LEGAL_OPERATOR_B64 is required for publication.');
    return fixture;
  }
  let operator;
  try {
    operator = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    // Parser diagnostics can contain fragments of the private payload.
    throw new Error('WOLFSBLVT_LEGAL_OPERATOR_B64 is not valid base64-encoded JSON.');
  }
  validateOperator(operator);
  if (requireProduction) assertPublishable(operator);
  return operator;
}

/** The shared Works contact form as the Impressum's additional direct contact route. */
export function additionalDirectContact(operator) {
  const contact = operator.additionalDirectContact;
  if (!contact || typeof contact !== 'object') throw new Error('The legal operator needs an additionalDirectContact pointer.');
  if (typeof contact.label !== 'string' || !contact.label.trim()) throw new Error('additionalDirectContact needs a label.');
  if (typeof contact.href !== 'string' || !isContactFormHref(contact.href)) throw new Error('additionalDirectContact needs an HTTPS or site-relative href.');
  return contact;
}

/** Refuses fixture values and contacts or routes that are not yet provisioned. */
export function assertPublishable(operator) {
  if (operator.fixture === true || containsFixtureValue(operator)) {
    throw new Error('Publication refuses fixture or placeholder legal-operator data.');
  }
  if (operator.contactStanding === 'adopted-unperformed') {
    throw new Error('Publication refuses legal contacts that are adopted but not yet provisioned (contactStanding: adopted-unperformed).');
  }
  const contact = additionalDirectContact(operator);
  if (contact.standing !== 'provisioned') throw new Error('Publication refuses an additional direct contact that is not provisioned.');
}

function isContactFormHref(value) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function validateOperator(operator) {
  if (!operator || operator.schemaVersion !== 1) throw new Error('Legal operator schemaVersion must be 1.');
  const required = [
    ['legalName', operator.legalName],
    ['postalAddress.streetAddress', operator.postalAddress?.streetAddress],
    ['postalAddress.postalCode', operator.postalAddress?.postalCode],
    ['postalAddress.locality', operator.postalAddress?.locality],
    ['postalAddress.countryName', operator.postalAddress?.countryName],
    ['contacts.legal', operator.contacts?.legal],
    ['contacts.impressum', operator.contacts?.impressum],
    ['contacts.privacy', operator.contacts?.privacy],
  ];
  for (const [name, value] of required) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Legal operator requires ${name}.`);
  }
}

function containsFixtureValue(value) {
  const sentinels = new Set([
    fixture.operatorId,
    fixture.legalName,
    fixture.postalAddress.streetAddress,
    fixture.postalAddress.locality,
    fixture.contacts.legal,
    fixture.contacts.impressum,
    fixture.contacts.privacy,
    fixture.additionalDirectContact.href,
  ]);
  const visit = (v) =>
    typeof v === 'string'
      ? sentinels.has(v) || v.includes('REPLACE_WITH_')
      : v && typeof v === 'object' ? Object.values(v).some(visit) : false;
  return visit(value);
}
