/**
 * The Wolfsblvt Works website's identity, destinations and legal facts. One source for pages, the footer, the
 * identity assets and the publication check. Operator data (name, postal address) never lives here; it reaches the
 * production build only through the private WOLFSBLVT_LEGAL_OPERATOR_B64 projection.
 */
export default {
  title: 'Wolfsblvt Works',
  url: 'https://wolfsblvt.works',
  contactUrl: 'https://contact.wolfsblvt.works/',
  description:
    'The home of Wolf’s software, experiments, and ideas: what he’s making, what drew him in, and what might be worth following next.',
  language: 'en',
  locale: 'en_US',
  themeColor: '#100b11',

  links: {
    source: 'https://github.com/Wolfsblvt/wolfsblvt.works',
    licences: 'https://github.com/Wolfsblvt/wolfsblvt.works/blob/main/LICENSE.md',
    security: 'https://github.com/Wolfsblvt/wolfsblvt.works/security/policy',
    github: 'https://github.com/Wolfsblvt',
    maker: 'https://wolfsblvt.com',
    discordCommunity: 'https://wolfsblvt.com/discord',
    // Shown as a visibly unavailable slot until the profile exists; set the URL and it becomes a link.
    bluesky: null,
    diffdevil: 'https://diffdevil.dev',
  },

  discord: { userId: '207895909734940674', handle: 'wolfsblvt' },

  // GitHub Sponsors is set up after the site and its assets are complete and before publication; the publication
  // checklist in docs/DEVELOPMENT.md carries that dependency.
  sponsors: {
    github: 'https://github.com/sponsors/Wolfsblvt',
    kofi: 'https://ko-fi.com/wolfsblvt',
  },

  contact: {
    inbox: 'contact@wolfsblvt.works',
  },

  legal: {
    lastUpdated: '2026-10-24',
    // Values the Privacy page states about hosting. Each `pending` entry renders as a marked fixture and makes the
    // publication check refuse until it carries the confirmed provider fact. Live readback stays a separate Ops step.
    privacy: {
      host: { value: 'Cloudflare, Inc.', pending: false },
      requestLogRetention: { value: 'Request logs are kept by the provider for up to 7 days', pending: false },
      transferBasis: {
        value: 'Covered US transfers rely on the EU–US Data Privacy Framework; other restricted transfers use the provider’s standard contractual clauses',
        pending: false,
      },
      securityCookie: {
        value:
          'If a security challenge is used, the hosting provider’s security layer may set a short-lived cookie to tell people from bots. It’s strictly necessary to keep the site reachable (§ 25(2) TDDDG) and isn’t used to identify you.',
        pending: false,
      },
      turnstile: { value: 'Cloudflare Turnstile', pending: false },
      contactLogRetention: { value: 'Those technical records are kept for up to 12 months in a private operational archive.', pending: false },
    },
  },
};
