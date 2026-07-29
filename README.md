# aleyasoftware.com

Marketing site for Aleya — structured cabling, access control, CCTV and Ubiquiti
UniFi networks in Lexington, Kentucky.

Plain HTML, CSS and JavaScript. **No build step, no dependencies, no framework.**

```
index.html          home — hero schematic, services, scroll-driven build
about.html          firm record + operating principles
pricing.html        rate, engagement models, health checks, managed tiers
contact.html        message / quote form (live, via Web3Forms)
css/styles.css      all styling — design tokens at the top
js/main.js          nav, tabs, form, scroll build, accordions
assets/favicon.svg  tab icon
nginx.conf          server config baked into the image
Dockerfile          nginx:alpine + the static files
docker-compose.yml  what Komodo deploys
```

## Running locally

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765>. Opening the HTML files directly works too,
but serving them is closer to production.

## Deploying with Komodo

The compose file builds the image from the `Dockerfile` in this repo, so Komodo
needs nothing but the repo itself.

1. **Push this repo to GitHub** (see below).
2. In Komodo, create a **Stack**.
3. Point it at this repository and set the compose file path to
   `docker-compose.yml`.
4. If the repo is private, attach a GitHub token/account in Komodo first.
5. **Deploy.** The site comes up on host port `8080`.
6. Point your reverse proxy (Caddy, Traefik, NPM — whatever fronts your other
   services) at `8080`, terminate TLS there, and send `aleyasoftware.com` to it.

Redeploying on a push is just Komodo's webhook — enable it on the Stack and add
the webhook URL to the repo's settings.

### Changing the port

`8080` is arbitrary. If it clashes with something already on the host, edit the
`ports` line in `docker-compose.yml` — only the left-hand number.

### Adding a page

`Dockerfile` copies top-level pages by name so that build files never end up in
the web root. Add any new `.html` to the `COPY` line, otherwise it will not
appear in the image.

## The contact form

Live, handled by [Web3Forms](https://web3forms.com) — no backend required. The
access key sits in `contact.html`; it is a public key that only delivers to the
verified address, so it is safe in the repo and in page source.

`js/main.js` posts the form with `fetch` and shows success or failure in place.
Two behaviours worth knowing:

- The **Send a message / Request a quote** tabs hide and show fieldsets, and
  validation skips anything hidden — so quote-only fields never block a short
  message.
- The email subject changes to match the active tab, so the inbox is triageable
  at a glance.

If submissions ever stop arriving, check the mailbox's Junk folder before
assuming the form broke — relayed mail gets quarantined by spam filters more
often than it gets lost.

## Notes on the CSS

Design tokens live at the top of `css/styles.css`. The palette is keyed to the
logo: `--ink-700: #383838` is the logo charcoal, `--red-500: #d9483f` the red.
Change the tokens and the whole site follows.

**One thing to watch:** a few rules have been bitten by specificity, where a
descendant selector like `.flatrate p` silently outranks a component class like
`.flatrate__fig`. Where that has come up it has been fixed by giving the element
its own class rather than escalating the selector. Worth continuing that habit —
the symptoms look like caching bugs and cost real time to track down.

## Before this is public

- [ ] `assets/og-image.png` — 1200×630, referenced by the `og:image` tag but not
      yet created, so shared links preview as a bare URL.
- [ ] Confirm the published claims are ones you want to be held to: **100+
      networks deployed**, **established 2024**, and the **under-one-business-day
      reply**.
- [ ] Point `aleyasoftware.com` DNS at the host once the stack is up.

## Pushing to GitHub

The repo is committed locally but has no remote. Create an empty repository on
GitHub (no README, no `.gitignore` — this repo has both), then:

```bash
git remote add origin git@github.com:YOUR-USERNAME/aleyasoftware.com.git
git push -u origin main
```
