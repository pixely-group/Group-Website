# WordPress landing package

This packages the same React hero, typography, effects and artwork used by the
Next.js homepage. The public page is server rendered and hydrated; its assets
are hosted by WordPress. No API keys are bundled. The PHP adapter reuses the
existing Contact Form 7 Brevo connection on the current WordPress site.

## Build

1. Make a Next.js build once to provide the locally cached font files.
2. Install the packaging dependency: `npm install --prefix /tmp/pixely-wp-build esbuild`.
3. Run `node wordpress/build.mjs`.

The output is `wordpress/dist/pixely-landing.zip`. Build artifacts are ignored
by Git. The hero source remains the original 7500-pixel photograph, exported
at 960, 1920, 3200 and 5120 pixels as quality-90 WebP with responsive selection.

For a static preview, run `node wordpress/preview.mjs` and open localhost:3001.
This preview does not run PHP and cannot submit the WordPress waitlist.

## Install and publish

Upload the ZIP through Network Admin → Plugins → Add Plugin → Upload Plugin,
then activate **Pixely Identity Landing** on the Pixely site only. Create or
edit a page with `[pixely_identity_landing]` as its content. The plugin serves
the landing template only for pages carrying this shortcode; it does not
replace the homepage or other content.

The prepared WordPress draft is page 1707, “AI-powered Identity & Fraud”,
with intended slug `ai-powered-identity-fraud`. It has not been published.

Before publishing, verify the draft preview and a real waitlist submission.
The current adapter uses waitlist 3, sender admin@pixely.com, and the existing
PIXELY_WAITLIST_CONFIRMED contact attribute. Existing suppressions are respected.
Rate counters are shared in WordPress transients; hosting-edge rate limiting
is still recommended for stronger protection against concurrent abuse.

The isolated template intentionally does not load Salient's theme header,
footer, scripts or global analytics. Its privacy link serves a factual
waitlist-specific notice on the same page.
