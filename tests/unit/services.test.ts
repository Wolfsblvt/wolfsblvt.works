import { describe, expect, it } from 'vitest';
import { createContactServices } from '../../worker/contact/services';
import type { ContactEnv } from '../../worker/contact/env';

function configuration(overrides: Partial<ContactEnv> = {}): ContactEnv {
  return {
    ENVIRONMENT_NAME: 'production',
    BUILD_VERSION: 'test',
    CONTACT_SENDING_ENABLED: 'true',
    CONTACT_INBOX: 'contact@wolfsblvt.works',
    TURNSTILE_SITE_KEY: '0x4AA-real-widget-shaped-key',
    TURNSTILE_SECRET_KEY: '0x4AA-real-secret-shaped-key',
    CONTACT_FORM_SECRET: 'form-secret',
    RATE_IP: { limit: async () => ({ success: true }) } as RateLimit,
    RATE_RECIPIENT: { limit: async () => ({ success: true }) } as RateLimit,
    RATE_LOCATION: { limit: async () => ({ success: true }) } as RateLimit,
    ...overrides,
  } as ContactEnv;
}

describe('contact delivery environment', () => {
  it('holds staging even when its send flag is set', () => {
    const services = createContactServices(configuration({ ENVIRONMENT_NAME: 'staging', TURNSTILE_SITE_KEY: '1x00000000000000000000AA' }), 'https://wolfsblvt.works/');
    expect(services.sendingEnabled).toBe(false);
  });

  it('holds production with test keys, placeholders or the old inbox', () => {
    for (const unsafe of [
      { TURNSTILE_SITE_KEY: '1x00000000000000000000AA' },
      { TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' },
      { TURNSTILE_SITE_KEY: 'REPLACE_WITH_PRODUCTION_TURNSTILE_SITE_KEY' },
      { CONTACT_INBOX: 'contact@wolfsblvt.com' },
    ]) {
      expect(createContactServices(configuration(unsafe), 'https://wolfsblvt.works/').sendingEnabled).toBe(false);
    }
    expect(createContactServices(configuration(), 'https://wolfsblvt.works/').sendingEnabled).toBe(true);
  });

  it('reports a binding outage as unavailable', async () => {
    const unavailable = { limit: async () => { throw new Error('binding unavailable'); } } as RateLimit;
    const services = createContactServices(configuration({ RATE_IP: unavailable }), 'https://wolfsblvt.works/');
    expect(await services.limitIp('203.0.113.9')).toBe('unavailable');
  });
});
