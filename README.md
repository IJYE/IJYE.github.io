# IJYE — The Engineering Record (website redesign draft)

A static redesign concept for the International Journal of Youth Engineering, using the existing repository's IJYE identity and publication concepts.

## Contents

- `index.html` — redesigned homepage
- `Journal/index.html` — journal archive landing page with Haven and Fallen tracks
- `assets/styles.css` — shared theme, responsive layout, typography, colors, components
- `assets/app.js` — accessible mobile navigation toggle

## Run locally

No build system or package installation is required. Open `index.html` in a browser. For best testing, serve the folder over HTTP:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

The files are arranged for a repository root deployment. Upload the contents of this folder to a test branch or separate repository. The `Journal/` and `assets/` links use relative paths so they work under a project-site URL as well.

## Design system

- Midnight navy: `#071827`
- Signal blue: `#168BFA`
- Safety orange: `#FF792B`
- Circuit teal: `#0E897C`
- Drawing white: `#F2F5F7`
- Display type: Space Grotesk
- Body type: Inter
- Technical labels: IBM Plex Mono

The robotic arm hero illustration is inline SVG, so it does not require an external image asset.

## Before launch

- Verify that `submissions@ijye.org` is active.
- Confirm current submission eligibility and nomination policy.
- Replace the empty archive states with approved article metadata only when articles are ready to publish.
- Add detailed peer-review, ethics, privacy, copyright, corrections, and author guidelines that accurately reflect IJYE's actual processes.
- Test all links and mobile behavior on the final hosting setup.

This is a design prototype, not a claim that articles have been published or peer reviewed.
