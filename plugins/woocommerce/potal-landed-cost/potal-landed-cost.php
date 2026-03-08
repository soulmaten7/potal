<?php
/**
 * Plugin Name: POTAL — Total Landed Cost Calculator
 * Plugin URI: https://www.potal.app
 * Description: Show real-time Total Landed Cost (import duties, taxes, customs fees) on WooCommerce product pages. Supports 240 countries, 5,371 HS codes, and DDP checkout.
 * Version: 1.0.0
 * Author: POTAL
 * Author URI: https://www.potal.app
 * License: GPL v2 or later
 * Text Domain: potal-landed-cost
 * Requires at least: 5.8
 * Tested up to: 6.5
 * WC requires at least: 7.0
 * WC tested up to: 8.8
 */

if (!defined('ABSPATH')) exit;

define('POTAL_VERSION', '1.0.0');
define('POTAL_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('POTAL_PLUGIN_URL', plugin_dir_url(__FILE__));
define('POTAL_API_BASE', 'https://www.potal.app/api/v1');

// ─── Admin Settings ─────────────────────────────────

add_action('admin_menu', function () {
    add_submenu_page(
        'woocommerce',
        'POTAL Settings',
        'POTAL Landed Cost',
        'manage_woocommerce',
        'potal-settings',
        'potal_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting('potal_settings', 'potal_api_key');
    register_setting('potal_settings', 'potal_seller_id');
    register_setting('potal_settings', 'potal_origin_country');
    register_setting('potal_settings', 'potal_widget_position');
    register_setting('potal_settings', 'potal_enable_ddp');
});

function potal_settings_page() {
    ?>
    <div class="wrap">
        <h1>POTAL — Total Landed Cost Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('potal_settings'); ?>
            <table class="form-table">
                <tr>
                    <th>API Key</th>
                    <td>
                        <input type="text" name="potal_api_key" value="<?php echo esc_attr(get_option('potal_api_key')); ?>" class="regular-text" />
                        <p class="description">Get your API key at <a href="https://www.potal.app/dashboard" target="_blank">potal.app/dashboard</a></p>
                    </td>
                </tr>
                <tr>
                    <th>Seller ID</th>
                    <td><input type="text" name="potal_seller_id" value="<?php echo esc_attr(get_option('potal_seller_id')); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th>Origin Country</th>
                    <td>
                        <input type="text" name="potal_origin_country" value="<?php echo esc_attr(get_option('potal_origin_country', 'US')); ?>" class="small-text" maxlength="2" />
                        <p class="description">2-letter ISO code (e.g. US, CN, DE)</p>
                    </td>
                </tr>
                <tr>
                    <th>Widget Position</th>
                    <td>
                        <select name="potal_widget_position">
                            <option value="after_price" <?php selected(get_option('potal_widget_position'), 'after_price'); ?>>After Price</option>
                            <option value="after_add_to_cart" <?php selected(get_option('potal_widget_position'), 'after_add_to_cart'); ?>>After Add to Cart</option>
                            <option value="before_tabs" <?php selected(get_option('potal_widget_position'), 'before_tabs'); ?>>Before Tabs</option>
                            <option value="shortcode" <?php selected(get_option('potal_widget_position'), 'shortcode'); ?>>Shortcode Only</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>Enable DDP Checkout</th>
                    <td>
                        <label>
                            <input type="checkbox" name="potal_enable_ddp" value="1" <?php checked(get_option('potal_enable_ddp'), 1); ?> />
                            Show DDP (all duties included) price option at checkout
                        </label>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// ─── Frontend Widget ────────────────────────────────

add_action('wp_enqueue_scripts', function () {
    if (!is_product()) return;

    $api_key = get_option('potal_api_key');
    if (!$api_key) return;

    // Enqueue POTAL widget script
    wp_enqueue_script(
        'potal-widget',
        'https://www.potal.app/widget/potal-widget.js',
        [],
        POTAL_VERSION,
        true
    );

    // Pass config to widget
    wp_localize_script('potal-widget', 'potalConfig', [
        'apiBase' => POTAL_API_BASE,
        'sellerId' => get_option('potal_seller_id', ''),
        'origin' => get_option('potal_origin_country', 'US'),
        'enableDdp' => (bool)get_option('potal_enable_ddp'),
    ]);
});

// Auto-insert widget based on position setting
$position = get_option('potal_widget_position', 'after_price');
if ($position !== 'shortcode') {
    $hook = match ($position) {
        'after_price' => 'woocommerce_single_product_summary',
        'after_add_to_cart' => 'woocommerce_after_add_to_cart_form',
        'before_tabs' => 'woocommerce_after_single_product_summary',
        default => 'woocommerce_single_product_summary',
    };
    $priority = ($position === 'after_price') ? 15 : 50;

    add_action($hook, function () {
        global $product;
        if (!$product) return;

        $price = $product->get_price();
        $name = $product->get_name();
        $sku = $product->get_sku();

        echo '<div id="potal-widget-container"
            data-product-name="' . esc_attr($name) . '"
            data-price="' . esc_attr($price) . '"
            data-sku="' . esc_attr($sku) . '">
        </div>';
    }, $priority);
}

// ─── Shortcode ──────────────────────────────────────

add_shortcode('potal_landed_cost', function ($atts) {
    $atts = shortcode_atts([
        'product_id' => '',
    ], $atts);

    $product_id = $atts['product_id'] ?: get_the_ID();
    $product = wc_get_product($product_id);
    if (!$product) return '';

    return '<div id="potal-widget-container"
        data-product-name="' . esc_attr($product->get_name()) . '"
        data-price="' . esc_attr($product->get_price()) . '"
        data-sku="' . esc_attr($product->get_sku()) . '">
    </div>';
});

// ─── REST API Proxy (avoid CORS) ────────────────────

add_action('rest_api_init', function () {
    register_rest_route('potal/v1', '/calculate', [
        'methods' => 'POST',
        'callback' => 'potal_proxy_calculate',
        'permission_callback' => '__return_true',
    ]);
});

function potal_proxy_calculate($request) {
    $api_key = get_option('potal_api_key');
    if (!$api_key) {
        return new WP_Error('no_api_key', 'POTAL API key not configured.', ['status' => 500]);
    }

    $body = $request->get_json_params();
    $body['origin'] = $body['origin'] ?? get_option('potal_origin_country', 'US');

    $response = wp_remote_post(POTAL_API_BASE . '/calculate', [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-API-Key' => $api_key,
        ],
        'body' => wp_json_encode($body),
        'timeout' => 15,
    ]);

    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), ['status' => 502]);
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    return rest_ensure_response($data);
}

// ─── Cart/Checkout DDP Integration ──────────────────

if (get_option('potal_enable_ddp')) {
    // Add DDP fee to cart
    add_action('woocommerce_cart_calculate_fees', function ($cart) {
        if (is_admin() && !defined('DOING_AJAX')) return;

        $api_key = get_option('potal_api_key');
        if (!$api_key) return;

        // Get shipping country from customer
        $destination = WC()->customer->get_shipping_country() ?: WC()->customer->get_billing_country();
        if (!$destination) return;

        $origin = get_option('potal_origin_country', 'US');
        if (strtoupper($origin) === strtoupper($destination)) return; // Domestic

        // Calculate total duties for all cart items
        $items = [];
        foreach ($cart->get_cart() as $cart_item) {
            $product = $cart_item['data'];
            $items[] = [
                'productName' => $product->get_name(),
                'price' => (float) $product->get_price(),
                'quantity' => $cart_item['quantity'],
            ];
        }

        if (empty($items)) return;

        $body = [
            'originCountry' => $origin,
            'destinationCountry' => $destination,
            'items' => $items,
            'shippingCost' => (float) $cart->get_shipping_total(),
        ];

        $response = wp_remote_post(POTAL_API_BASE . '/checkout?action=quote', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-API-Key' => $api_key,
            ],
            'body' => wp_json_encode($body),
            'timeout' => 10,
        ]);

        if (is_wp_error($response)) return;

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!$data || !$data['success'] || !isset($data['data']['quote'])) return;

        $quote = $data['data']['quote'];
        $duty_total = ($quote['importDuty'] ?? 0) + ($quote['vat'] ?? 0) + ($quote['customsFee'] ?? 0);

        if ($duty_total > 0) {
            $cart->add_fee(
                __('Import Duties & Taxes (DDP)', 'potal-landed-cost'),
                $duty_total,
                false // Not taxable
            );
        }
    });
}
