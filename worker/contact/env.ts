/**
 * Bindings and variables the contact service needs from its Worker. The later Works site Worker extends this with
 * its own bindings (for example `ASSETS`); the contact pipeline never depends on them. Secrets are set with
 * `wrangler secret put` and never live in configuration files.
 */
export interface ContactEnv {
  CONTACT_INTERNAL: SendEmail;
  CONTACT_VISITOR_COPY: SendEmail;

  RATE_IP: RateLimit;
  RATE_RECIPIENT: RateLimit;
  RATE_LOCATION: RateLimit;

  ENVIRONMENT_NAME: string;
  BUILD_VERSION: string;
  TURNSTILE_SITE_KEY: string;
  CONTACT_INBOX: string;
  /** "true" enables sending; anything else is the total-send circuit breaker. */
  CONTACT_SENDING_ENABLED: string;

  // Secrets
  TURNSTILE_SECRET_KEY: string;
  CONTACT_FORM_SECRET: string;
}
