# Wolfsblvt Works website security reporting

## Meaning

This is the route for privately reporting a suspected vulnerability in the Wolfsblvt Works website, including its
contact service at `contact.wolfsblvt.works`. Reports go to this repository's administrators through GitHub's private
vulnerability reporting. It does not promise a response time or a support window that hasn't been established.

## Report privately

Use the **Report a vulnerability** button on
[this repository's security advisories page](https://github.com/Wolfsblvt/wolfsblvt.works/security/advisories). Include
the affected URL or commit, a reproducible description and the security consequence. Please keep exploit details out of
public Issues and pull requests while the report is assessed.

The contact service is the part most worth a close look: it accepts input from anyone, sends email and runs abuse
controls. Its pipeline and invariants are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#the-contact-service). Please
don't test it by sending volumes of real messages or by trying to send mail to third parties through it; describe the
issue instead.

For anything that isn't a vulnerability, the contact page at `contact.wolfsblvt.works` is the way to reach Wolf once
the site is live.
