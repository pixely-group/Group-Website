import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

// One self-contained Custom HTML block for pixely.cc. It needs no page builder: WPBakery and Salient Core
// are inactive on the site (2026-10-14), so builder shortcodes print as text. Shortcodes inside a Custom HTML
// block still run, so the Contact Form 7 waitlist renders in place.
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const FORM = `[contact-form-7 id="560641d" title="Waitlist"]`;
const ART = "https://pixely.cc/wp-content/uploads/2026/10/pixely-spoof-detected.jpg";
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400&display=swap">`;

const css = read("./src/landing.css").trim();
const js = read("./src/landing.js").trim();
const markup = (form) => read("./src/landing.html").trim().replace("{{FORM}}", form).replace("{{ART_SRC}}", ART);
// WordPress content filters read `<`, `>` and `&&` inside an inline script as markup and rewrite them
// (seen live: `<= 1 && ny >` became `&#038;&#038;`), so the script must contain none of them.
if (/[<>&]/.test(js)) throw new Error("landing.js must not contain <, > or &");
const SCRIPT = `<script>\n${js}\n</script>`;
const inner = (form) => `${FONTS}\n<style>\n${css}\n</style>\n${markup(form)}\n${SCRIPT}`;
const block = `<!-- wp:html -->\n${inner(FORM)}\n<!-- /wp:html -->\n`;

// guard: nothing in the block may look like a WPBakery shortcode, and the form shortcode must appear once
if (/\[vc_|\[nectar_/.test(block)) throw new Error("builder shortcode in block");
if (block.split(FORM).length !== 2) throw new Error("form shortcode count");
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/page-block.html", import.meta.url), block);

// ---- preview: Salient's No Header/Footer page shell with the live site's stylesheets and the real CF7 markup ----
const SALIENT = [
  "plugins/contact-form-7/includes/css/styles.css?ver=6.2.1",
  "themes/salient/css/build/grid-system-legacy.css?ver=18.2.1",
  "themes/salient/css/build/style.css?ver=18.2.1",
  "themes/salient/css/build/third-party/cf7.css?ver=18.2.1",
  "themes/salient/css/build/responsive.css?ver=18.2.1",
  "themes/salient/css/build/skin-material.css?ver=18.2.1",
  "uploads/salient/salient-dynamic-styles-multi-id-1.css?ver=77676",
  "themes/salient/css/build/style-non-critical.css?ver=18.2.1",
].map((p) => `<link rel="stylesheet" href="https://pixely.cc/wp-content/${p}">`).join("\n");
const cf7 = `<div class="wpcf7 no-js" id="wpcf7-f1698-p0-o1" lang="en-US" dir="ltr" data-wpcf7-id="1698"><div class="screen-reader-response"><p role="status" aria-live="polite" aria-atomic="true"></p> <ul></ul></div><form action="#" method="post" class="wpcf7-form init" aria-label="Contact form" novalidate="novalidate" data-status="init"><fieldset class="hidden-fields-container"><input type="hidden" name="_wpcf7" value="1698" /></fieldset><p><label class="screen-reader-text" for="px-email">Work email</label><span class="wpcf7-form-control-wrap" data-name="your-email"><input size="40" maxlength="400" class="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email" id="px-email" autocomplete="email" aria-required="true" aria-invalid="false" placeholder="Work email" value="" type="email" name="your-email" /></span><input class="wpcf7-form-control wpcf7-submit has-spinner" type="submit" value="Join the waitlist" /><span class="wpcf7-spinner"></span></p><div class="wpcf7-response-output" aria-hidden="true"></div></form></div>`;
// ?state=sent|invalid|failed shows CF7's response states for QA
const states = `<script>(function(){var m=location.search.match(/state=(\\w+)/);if(!m)return;var f=document.querySelector('.wpcf7-form'),o=f.querySelector('.wpcf7-response-output');f.classList.remove('init');f.classList.add(m[1]);o.textContent={sent:'Thank you for your message. It has been sent.',invalid:'One or more fields have an error. Please check and try again.',failed:'There was an error trying to send your message. Please try again later.'}[m[1]]||'';if(m[1]==='invalid'){var w=f.querySelector('.wpcf7-form-control-wrap');w.insertAdjacentHTML('beforeend','<span class="wpcf7-not-valid-tip" aria-hidden="true">Please fill out this field.</span>');}})();</script>`;
const body = `<body class="page-template page-template-template-no-header-footer page-template-template-no-header-footer-php page wp-theme-salient material" data-footer-reveal="false" data-header-format="default" data-body-border="off" data-boxed-style="" data-header-breakpoint="1000" data-form-style="default" data-form-submit="regular" data-is="minimal" data-button-style="rounded" data-ext-responsive="true" data-ext-padding="40" data-animated-anchors="true" data-ajax-transitions="false" data-smooth-scrolling="0">`;
const shell = `<div class="ocm-effect-wrap"><div class="ocm-effect-wrap-inner"><div id="header-space" data-header-mobile-fixed="1"></div><div id="header-outer" class="transparent force-contained-rows"><header id="top" role="banner" aria-label="Main Menu"><div class="container"><div class="row"><div class="col span_3">Pixely</div></div></div></header></div><div id="ajax-content-wrap"><div class="container-wrap"><div class="container main-content" role="main"><div class="row">\n${inner(cf7)}\n</div></div></div></div></div></div>`;
const preview = `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Identity – Pixely (preview)</title>\n${SALIENT}\n</head>${body}\n${shell}\n${states}</body></html>`;
writeFileSync(new URL("./out/preview.html", import.meta.url), preview);

console.log(JSON.stringify({ blockChars: block.length, blockBytes: Buffer.byteLength(block), blockSha: sha(block) }, null, 1));
