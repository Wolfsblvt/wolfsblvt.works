# Contact security review, 24 October 2026

## Meaning

The dated record of the first security review of the published Works site and its contact form, and of the corrections
its independent cold review asked for: who looked, how, what was found, what each finding rests on, and what was done
about it. It preserves the review's evidence boundaries, so a
later reader can tell a confirmed live fact from a source inference. Current behaviour lives in
[Architecture](ARCHITECTURE.md) and the choices in [Decisions](DECISIONS.md); this page is history, not the contract.

## Provenance

- **Review.** Mira, at Wolf's request, on 2026-10-24 between about 22:35 and 22:55 UTC, against the production site
  serving published source `69630063e7f7f3af3f3f13eb019a56db6c438efa` (Worker version
  `173deceb-12d1-4f60-94b5-2c48c763dbcf`, sending enabled), with the matching source checkout read alongside. The
  session reported its model as GPT-6 in Codex, so the review does not claim the security lane originally asked for.
- **Relay.** At Wolf's direction the findings went straight to the Wolf Ops Lead (Katja), who took custody of all of
  them, contained the plaintext finding at the edge and placed the source repair (private publication room, #916).
- **Repair.** Mira, in the change that adds this record (`fix/contact-security-recovery`). Wolf Ops owns its security
  judgment and the independent review that change requires.

## Method and limits

Bounded live probes with harmless requests, plus a reading of the deployed source and its configuration. The review
sent no real message, changed no repository or provider state, did not exhaust any rate limit, did not hold a form open
for 12 hours and did not read logs. Findings 2 and 3 are therefore inferences from the source and the deployed limits,
not observed failures.

The live probes confirmed these refusals, which the repair keeps: another `Origin` (403), an unsupported content type
(415), a missing or expired form token (400), an invalid email address (422), a submission without Turnstile proof
(refused before any send) and an oversized request (413).

## Findings and dispositions

### 1. The contact form was reachable over plain HTTP

**Evidence (live).** `GET http://contact.wolfsblvt.works/` returned 200 with the form and no redirect;
`http://wolfsblvt.works/` also returned 200. A harmless multipart `POST` to the HTTP contact URL with a same-URL
`Origin` reached the handler and got its form-token refusal (400). The zone's HTTPS upgrade was off. HTTPS responses
carried HSTS, which does not protect a first plaintext visit. The page script posted to the page's own URL, and the
handler compared `Origin` with the request URL without requiring HTTPS, so a visitor who arrived over HTTP would have
sent their name, email and message in plaintext.

**Disposition.** Supported. Wolf Ops added a native zone rule at 2026-10-24 23:05 UTC that answers plain HTTP on both
hosts with a 308 to the same HTTPS path and query, and read it back. This change adds a source-owned second layer that
does not depend on the zone: the Worker redirects plain HTTP on both public hosts to HTTPS before serving the contact
page, the home page or a submission, and production's handler accepts a submission only from
`https://contact.wolfsblvt.works`. Local development on other hosts keeps plain HTTP. `npm run check:live-https` reads
the redirect and HSTS back from outside after a deployment or route change.

**Unknown.** Whether anyone submitted over plain HTTP before the containment, and whether such traffic was observed.

### 2. Failed bot checks could spend the shared rate limits

**Evidence (source and configuration).** The location limit ran after the form-token check but before validation and
Turnstile, and the per-recipient limit ran after validation but before Turnstile. The location limiter uses one literal
key, so it is a shared budget per Cloudflare location (60 a minute deployed); the recipient limiter allowed 5 a minute
per email address, and the per-IP limiter 10 a minute. Anyone holding a freshly served form token could therefore use up
a location's allowance without passing Turnstile, or a chosen address's allowance with valid fields and a failing
Turnstile, and block legitimate sends for that location or to that address.

**Disposition.** Supported. The pipeline now runs the per-IP limit early, then validation, then Turnstile, and only then
the location and recipient limits, right before sending. An attempt that fails validation or the bot check spends only
its own IP's allowance. The trade-off: calls to Turnstile's verification endpoint are now bounded per IP rather than
also per location.

### 3. A long-open form had no way to recover in place

**Evidence (source).** Form tokens expire after 12 hours. The page installed its token once, and the retry path reused
it. The expired-token answer asked the visitor to reload and said their text was kept in the form, but an ordinary
reload can discard what was typed.

**Disposition.** Supported. An expired token, or one signed before the form secret changed, now gets an answer marked
renewable. The page fetches itself again for a freshly issued token, puts it into the form without touching what was
typed, and asks the visitor to send again; it never sends on its own and stores nothing. If the fresh form can't be
fetched, the page says so and keeps the text in the form instead of promising a safe reload. Token signing, lifetime
and the minimum interaction time are unchanged.

**Found while repairing it.** Back at the form after a refusal, the send button waited for a bot-check answer that the
widget had usually already given since its reset, so it could stay disabled. It is now ready as soon as an answer is in
hand. This was found by reading the code, not observed live.

### 4. Repository and room guidance still said the site was unpublished

**Evidence.** The repository instructions and the contact Work room described publication as dormant while production
was serving the published source with sending enabled.

**Disposition.** Supported. The repository's instructions and configuration comments now say the site is public and
that routes and domains are Wolf Ops' provider state. Moving the durable branch to `PR preferred`, which the
instructions tie to publication, is left to the site's custodian. Currentizing the private room belongs to its
custodian and is returned there.

## Cold review corrections (2026-10-25)

Nyxara's independent [cold review](https://github.com/Wolfsblvt/emergency-meeting/issues/927#issuecomment-6391511186) of
the repair at `a8aa066` found two Works defects, both accepted
([disposition](https://github.com/Wolfsblvt/emergency-meeting/issues/927#issuecomment-6391536902)) and corrected here.

**F1: a late refresh could replace a successful send with "not sent".** The submission released its lock and reset
Turnstile before awaiting the refresh, so the widget's next answer re-enabled Send on the visible form. A second send
could start a second refresh that overtook the first; the first then replaced the visitor's success with "Your message
was not sent." and a Try again inviting a duplicate. The review reproduced this by running the source with controlled
substitutes. **Correction:** sending and its refresh are now one pending interaction: Send stays disabled, a widget
answer is only recorded, and no second submission can start until the outcome is shown. The refresh is bounded at 15
seconds. Because the refreshed token is younger than the 4-second minimum, Send waits that out instead of being refused.
The browser suite now holds a refresh open while the widget answers, tries to submit again, and checks the later result
stays; a second spec refreshes against the real local Worker and passes its real minimum-age check. "Write another"
had the same stuck-button cause as Try again and now uses the same readiness rule.

**F2: the publication readback could pass with static pages open over HTTP.** The Worker runs first only on `/` and the
contact paths; existing static files are served without it. The readback probed the root and a missing path, both of
which reach the Worker's own redirect, so it stayed green if the zone rule were lost. **Correction:** it also probes
`/privacy/` and `/robots.txt` over plain HTTP (GET, empty POST, path and query), first confirming over HTTPS that both
exist, accepts only real upgrade statuses, and runs inside every `Website` publication readback. A test proves it fails
when roots upgrade but a static page answers plaintext. Static serving of the legal pages and assets stays as designed.

The renewal copy now covers expiry and a changed secret alike ("This form needed refreshing before it could send"). It
remains provisional until Wolf or Nyxara confirms it.
