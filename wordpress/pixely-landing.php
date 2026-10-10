<?php
/**
 * Plugin Name: Pixely Identity Landing
 * Description: The Pixely identity landing page and private Brevo waitlist adapter. Use [pixely_identity_landing] on one page.
 * Version: 1.0.0
 * Author: Pixely
 */
if (!defined('ABSPATH')) { exit; }

function pixely_landing_brevo($path, $method = 'GET', $body = null) {
    $key = class_exists('WPCF7_Sendinblue') ? WPCF7_Sendinblue::get_instance()->get_api_key() : '';
    if (!$key) { return new WP_Error('configuration', 'Email connection is unavailable.'); }
    $args = array('method' => $method, 'timeout' => 12, 'headers' => array('api-key' => $key, 'Content-Type' => 'application/json'));
    if ($body !== null) { $args['body'] = wp_json_encode($body); }
    $response = wp_remote_request('https://api.brevo.com/v3/' . $path, $args);
    if (is_wp_error($response)) { return $response; }
    $status = wp_remote_retrieve_response_code($response);
    $data = json_decode(wp_remote_retrieve_body($response), true);
    if ($status >= 400) { return new WP_Error($data['code'] ?? 'provider', 'Email service request failed.', array('status' => $status)); }
    return is_array($data) ? $data : array();
}

function pixely_landing_error($message, $status = 503) {
    return new WP_REST_Response(array('error' => $message), $status, array('Cache-Control' => 'no-store'));
}

function pixely_landing_waitlist($request) {
    $origin = $request->get_header('origin');
    $parts = wp_parse_url(home_url());
    $expected = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
    if ($origin && $origin !== $expected) { return pixely_landing_error('Please join from the Pixely website.', 403); }
    if (strpos($request->get_header('content-type'), 'application/json') !== 0) { return pixely_landing_error('Invalid request.', 415); }
    if (strlen($request->get_body()) > 2048) { return pixely_landing_error('Request too large.', 413); }
    $body = json_decode($request->get_body(), true);
    if (!is_array($body)) { return pixely_landing_error('Invalid request.', 400); }
    $success = new WP_REST_Response(array('ok' => true), 200, array('Cache-Control' => 'no-store'));
    if (!empty($body['website'])) { return $success; }
    $email = isset($body['email']) && is_string($body['email']) ? strtolower(trim($body['email'])) : '';
    if (strlen($email) > 254 || !is_email($email)) { return pixely_landing_error('Please enter a valid email address.', 400); }
    $hash = hash('sha256', $email);
    // Use the direct peer, not a client-controlled forwarding header. Shared-host
    // proxy filtering should additionally rate-limit at the edge when available.
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    foreach (array('ip:' . $ip => 10, 'email:' . $hash => 3) as $value => $max) {
        $key = 'px_rate_' . hash_hmac('sha256', $value, wp_salt());
        $count = (int) get_transient($key);
        if ($count >= $max) { return pixely_landing_error('Too many attempts. Please try again in a minute.', 429); }
        set_transient($key, $count + 1, 60);
    }
    $contact_path = 'contacts/' . rawurlencode($email);
    $contact = pixely_landing_brevo($contact_path);
    if (is_wp_error($contact) && (int) ($contact->get_error_data()['status'] ?? 0) !== 404) {
        return pixely_landing_error('We couldn’t finish your signup. Please try again in a moment.');
    }
    if (!is_wp_error($contact) && (!empty($contact['emailBlacklisted']) || !empty($contact['attributes']['PIXELY_WAITLIST_CONFIRMED']))) { return $success; }
    $result = pixely_landing_brevo('contacts', 'POST', array('email' => $email, 'listIds' => array(3), 'updateEnabled' => true));
    if (is_wp_error($result)) { return pixely_landing_error('We couldn’t finish your signup. Please try again in a moment.'); }
    $idempotency = substr($hash,0,8) . '-' . substr($hash,8,4) . '-4' . substr($hash,13,3) . '-a' . substr($hash,17,3) . '-' . substr($hash,20,12);
    $mail = array(
        'sender' => array('name' => 'Pixely', 'email' => 'admin@pixely.com'),
        'to' => array(array('email' => $email)),
        'subject' => 'You’re on the list — Pixely',
        'textContent' => "You’re on the list.\n\nThanks for your interest in Pixely. We’ve received your request to join the waitlist. We’ll email you the moment your spot is ready.\n\nThe Pixely team",
        'htmlContent' => '<!doctype html><html lang="en"><body style="margin:0;background:#0a0a0b;color:#ece9e1;font-family:Arial,sans-serif"><div style="max-width:520px;margin:0 auto;padding:48px 24px"><p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#8c9bff">Pixely / Waitlist</p><h1 style="font-size:36px;line-height:1.1;font-weight:600">You’re on the list.</h1><p style="font-size:16px;line-height:1.7">Thanks for your interest in Pixely. We’ve received your request to join the waitlist.</p><p style="font-size:16px;line-height:1.7">We’ll email you the moment your spot is ready.</p><p style="margin-top:32px;border-top:1px solid #343436;padding-top:24px;font-size:13px">The Pixely team</p></div></body></html>',
        'headers' => array('idempotencyKey' => $idempotency), 'tags' => array('pixely-waitlist')
    );
    $sent = pixely_landing_brevo('smtp/email', 'POST', $mail);
    if (is_wp_error($sent) && $sent->get_error_code() !== 'duplicate_parameter') {
        return pixely_landing_error('We couldn’t finish your signup. Please try again in a moment.');
    }
    $marked = pixely_landing_brevo($contact_path, 'PUT', array('attributes' => array('PIXELY_WAITLIST_CONFIRMED' => true)));
    if (is_wp_error($marked)) { return pixely_landing_error('We couldn’t finish your signup. Please try again in a moment.'); }
    return $success;
}

add_action('rest_api_init', function () {
    register_rest_route('pixely/v1', '/waitlist', array('methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'pixely_landing_waitlist'));
});

add_shortcode('pixely_identity_landing', function () { return '<p>Pixely identity landing page.</p>'; });
add_action('template_redirect', function () {
    if (!is_singular('page') || post_password_required() || !has_shortcode(get_post()->post_content, 'pixely_identity_landing')) { return; }
    $assets = plugin_dir_url(__FILE__) . 'assets/';
    $privacy = isset($_GET['pixely_privacy']);
    $title = $privacy ? 'Pixely — Waitlist privacy' : 'Pixely — AI-powered identity & fraud solution';
    $description = 'AI-powered KYC and fraud detection for banks and financial institutions in Algeria & MENA — hosted locally, privacy-first.';
    ?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0a0a0b"><title><?php echo esc_html($title); ?></title><meta name="description" content="<?php echo esc_attr($description); ?>"><meta property="og:title" content="<?php echo esc_attr($title); ?>"><meta property="og:description" content="<?php echo esc_attr($description); ?>"><meta property="og:type" content="website"><meta property="og:image" content="<?php echo esc_url($assets . 'hero-1920.webp'); ?>"><link rel="canonical" href="<?php echo esc_url(get_permalink() . ($privacy ? '?pixely_privacy=1' : '')); ?>"><link rel="stylesheet" href="<?php echo esc_url($assets . 'app.css?v=1.0.0'); ?>"><style>noscript h1{opacity:1!important}</style></head><body class="grain min-h-full bg-ink text-bone"><?php
    if ($privacy) {
        ?><main style="max-width:720px;padding:80px 24px;margin:auto;font:18px/1.7 Archivo,Arial,sans-serif"><a href="<?php echo esc_url(get_permalink()); ?>">← Back to Pixely</a><h1 style="font-size:48px;line-height:1.1;margin:40px 0 24px">Waitlist privacy</h1><p>When you join the Pixely waitlist, we collect your email address to record your interest, send a confirmation, and contact you when your spot is ready.</p><p>Waitlist email addresses are stored and emails are delivered through Brevo. The website uses temporary request counters to limit automated submissions. The waitlist does not require an account or ask for identity documents.</p><p>To ask about your information or request removal from the waitlist, contact <a href="mailto:admin@pixely.com">admin@pixely.com</a>.</p></main><?php
    } else {
        echo '<div id="pixely-root">' . str_replace('__PIXELY_ASSETS__', esc_url($assets), file_get_contents(__DIR__ . '/hero.html')) . '</div>';
        echo '<script>window.PixelyLanding=' . wp_json_encode(array('assets' => $assets, 'endpoint' => rest_url('pixely/v1/waitlist')), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';</script>';
        echo '<script type="module" src="' . esc_url($assets . 'app.js?v=1.0.0') . '"></script>';
        echo '<noscript><style>#pixely-root h1{opacity:1!important}</style><p style="padding:24px">Enable JavaScript to join the waitlist, or contact <a href="mailto:admin@pixely.com">admin@pixely.com</a>.</p></noscript>';
    }
    echo '</body></html>';
    exit;
}, 0);
