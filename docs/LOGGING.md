# Logging and operational evidence

## Meaning

The Wolfsblvt Works website keeps exactly two kinds of records: one structured `contact.submission` event for every
contact attempt, written by the contact service, and the request logs Cloudflare keeps for every response. They exist
so Wolf can tell whether a message arrived, why an attempt was refused, and whether the form is being abused, without
ever holding what someone wrote. This document owns what those records contain and exclude, where they go, how long
they stay and who can read them. The exact event shape lives in `worker/contact/log.ts` and its tests; the visitor-facing
account lives on the Privacy and data page.

Standing: the event contract is implemented and tested. Hosting is not adopted yet, so nothing below is configured on
Cloudflare; the storage and retention sections describe the selected shape and name what Wolf Ops still has to set up.

## Purpose classes

- **Operational and diagnostic:** did the submission reach the inbox, did the visitor's copy go out, which stage
  failed, how long it took, which build and environment handled it.
- **Security and abuse:** honeypot, form-token, origin and rate-limit outcomes, Turnstile results, and the network facts
  needed to see a flood or a probe.

Both classes live in the same event: one attempt, one record. There is no audit ledger (no accounts or administrative
state), no analytics and no product telemetry.

## Meaningful event families

| Event | Emitted | Terminal outcome |
| --- | --- | --- |
| `contact.submission` | exactly once per POST to the contact service, on every exit path | `stage` names where it ended: `sent`, `sent-copy-failed`, `internal-send-failed`, or a refusal (`disabled`, `body-too-large`, `bad-request`, `origin`, `content-type`, `honeypot`, `form-token`, `rate-limited`, `rate-unavailable`, `validation`, `turnstile`) |

Page views produce no application event. The home page's pile seed is computed and discarded; nothing about it is
logged.

## Identifiers and network evidence

Each event carries the submission `reference` shown to the visitor (for example `WW-20261014-K7Q3M`), the client's
`submissionId` and `attempt` number, a `possibleDuplicate` flag for client-reported retries, `build`, `environment`,
`host`, `clientIp`, Cloudflare's `colo` and `country`, whether a user agent was present (not the user agent itself),
the chosen `category` and `product`, the Turnstile result and error codes, which rate limit applied, the HTTP `status`,
`durationMs`, and the Email Service message IDs and error codes for both messages.

The reference is the join between a visitor who writes back ("my message WW-… didn't arrive"), the internal
notification in the inbox, and the event.

## Content and secret boundary

Never logged: the visitor's name, email address, subject, message and Turnstile token. `assertRedacted` in
`worker/contact/log.ts` refuses an event object that grows any of those keys, and the tests pin the event shape. Form
secrets and the Turnstile secret never appear in events or errors.

Cloudflare's invocation logs record the request method and URL. No URL on this site carries content: the contact page's
only query parameter is `?product=<slug>`, a public product name, and submissions travel in the POST body, which is not
logged. Enabling `redact_query_string` is still harmless and may be chosen at adoption.

There is no elevated debug mode. If one is ever needed for a specific incident, it is a deliberate, time-boxed change
with its own record here, and it still never captures message content.

## Storage, rotation, compression, and export

- **Hot surface:** Cloudflare Workers Logs (`observability.enabled` in `wrangler.jsonc`). The event is one JSON line on
  `console.log`, searchable in the dashboard. On the Works account's Workers Paid plan, Workers Logs keeps events for 7
  days (Cloudflare documentation, 2026-09-22; to be confirmed at adoption).
- **Retained export:** not set up. The Works route for anything kept longer than the hot window is Logpush of Workers
  Trace Events into Cloudflare Pipelines, classified and written to a private R2 bucket partitioned by product,
  environment, class and date, with an R2 lifecycle rule for the retention below. Wolf Ops owns that adoption.
- **Mail:** the internal notification and the visitor's copy are ordinary email in the Works mailbox and the visitor's
  own mailbox. They are correspondence, not logs, and follow the mailbox's own lifecycle.

## Retention and deletion

Selected, not yet configured:

- **`contact.submission` events: 12 months.** Wolf chose the Works default for security events on 2026-10-14. The event
  is primarily abuse and security evidence (honeypot, token, rate-limit and Turnstile outcomes with the client IP), and
  it also answers "did my message arrive". A 90-day override was proposed, on the grounds that the form has no
  accounts to compromise, and declined. The retained R2 lifecycle carries 12 months; the 7-day hot window is not the
  policy.
- **Cloudflare request logs:** the provider's window (7 days on the current plan), longer only to investigate a specific
  attack.

The Privacy and data page states both. Its sentences stay `pending` in `site.config.mjs`, and the publication check
refuses, until the retained route exists and the values are read back from it.

Nothing in these records identifies a visitor by name or email, so there is no per-person deletion path to run;
records expire with their retention.

## Sampling and aggregation

None. Every attempt writes its event, successes included; the volume of a personal contact form doesn't earn sampling.
An absent event means the request never reached the contact service (for example a static-asset error or a request
blocked before the Worker), not that a send silently happened.

## Access, dashboards, and user visibility

Wolf, through the Cloudflare dashboard (Workers Logs) and, once adopted, the private R2 bucket. No one else has access
and there are no dashboards or alerts yet. Visitors see their own outcome and reference on the page and in their copy.

## Alerts, incidents, and recovery joins

No alerts are configured. A visitor's report carries the reference; the reference finds the event and the
notification. A deployment shows in the event's `build` field. If abuse ever needs a response, `CONTACT_SENDING_ENABLED`
switches all sending off without a deploy of new code.

## Privacy and public disclosure

`src/pages/privacy/index.astro` tells visitors that the hosting provider handles their IP address and request details,
that the contact service records a technical event about each attempt (time, IP address, topic and project picked,
outcome) without their name, email, subject or message, and how long each is kept. The retention sentences and the
hosting facts are `pending` in `site.config.mjs` until they are read back from the deployed setup.

## Deliberate omissions and overrides

- No user-agent string, only whether one was present: the browser family adds nothing to abuse decisions that the
  rate limits and Turnstile don't already cover.
- No hashed email in the event. The per-recipient rate limit uses a hash in memory; logging it would create a
  pseudonymous identifier for no diagnostic gain.
- No separate operational stream: the one event serves both classes and takes the longer, security retention.
