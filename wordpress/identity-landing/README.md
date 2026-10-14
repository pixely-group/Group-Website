# Identity landing for pixely.cc

A one-screen WordPress page that follows the structure of the identity landing in
`wordpress/dist/pixely-landing/hero.html`: wordmark, three-line headline, sub-line,
waitlist form with its note and privacy disclosure, and the scan artwork.

It is one **Custom HTML block** with its own styles and script. It needs no page builder,
because WPBakery and Salient Core are inactive on pixely.cc. The waitlist is the existing
Contact Form 7 form 1698, placed by its shortcode inside the block.

## Build

```bash
node wordpress/identity-landing/build.mjs
```

This writes `out/page-block.html` (paste into WordPress) and `out/preview.html`.
Edit `src/landing.html`, `src/landing.css` and `src/landing.js`, never the output.

## Preview

Run the `wordpress-preview` launcher, then open `/identity-landing/out/preview.html`.
The preview loads the live site's Salient and Contact Form 7 stylesheets inside Salient's
page shell. `?state=sent`, `?state=invalid` and `?state=failed` show the form's replies.
`/identity-landing/out/reference.html` renders the reference landing for comparison.

## Put it on WordPress

1. Pages → Add New. Title "Identity". Page Attributes → Template → No Header/Footer.
2. Switch to the code editor (block editor) or the Text tab (classic editor).
3. Paste all of `out/page-block.html`, including the `<!-- wp:html -->` comments. Save as draft.
4. Preview the draft at desktop and phone widths.
5. Go live with Settings → Reading → Homepage, then purge the cache from the admin bar.

The current draft is page 1712 (https://pixely.cc/?page_id=1712).

The script is inline and must not contain `<`, `>` or `&`: WordPress rewrites them inside
inline scripts in post content (`<= 1 && ny >` once became `&#038;&#038;`). The build refuses such a script.

The account that saves the page needs the `unfiltered_html` capability (a super admin
has it). Without it WordPress strips the `<style>` and `<script>` from the block.
