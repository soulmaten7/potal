=== POTAL — Total Landed Cost Calculator ===
Contributors: potal
Donate link: https://www.potal.app
Tags: landed cost, import duty, customs, tariff, international shipping, DDP, cross-border, woocommerce
Requires at least: 5.8
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
WC requires at least: 7.0
WC tested up to: 9.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Show real-time Total Landed Cost on WooCommerce product pages. 240 countries, duties, taxes, customs fees — all in one widget.

== Description ==

POTAL calculates and displays the **Total Landed Cost** for international orders, including:

* Import duties based on HS code classification (AI-powered)
* VAT/GST for 240+ countries and territories
* Customs processing fees (CBP MPF, EU IPC, etc.)
* De minimis threshold detection
* Trade remedy duties (AD/CVD/Safeguard)
* Section 301/232 tariffs (US)
* DDP checkout (optional) — buyer pays once, no surprise fees at delivery
* Insurance and brokerage fee estimates

= Features =

* **Auto HS Code Classification** — AI classifies products into HS codes automatically
* **240+ Countries** — Full global coverage with real duty rates from 7 government APIs + MacMap
* **4-Stage Duty Fallback** — AGR (FTA) → MIN → NTLC (MFN) → Hardcoded for maximum accuracy
* **DDP/DDU Support** — Delivered Duty Paid or Unpaid with clear buyer charge breakdown
* **Multi-currency** — Display prices in buyer's local currency with 15-min refresh rates
* **WooCommerce Blocks** — Compatible with the new block-based cart and checkout
* **Shortcode Support** — Place the widget anywhere with `[potal_landed_cost]`
* **REST API** — Full programmatic access for custom integrations
* **Confidence Score** — Each calculation includes accuracy confidence rating

= WooCommerce Blocks Compatibility =

This plugin is fully compatible with WooCommerce Blocks:

* **Product Page Block** — Landed cost widget renders inside block-based product pages
* **Cart Block** — DDP charges are added as cart fees visible in the block cart
* **Checkout Block** — Full DDP/DDU display in block-based checkout

= Requirements =

* WooCommerce 7.0 or higher
* PHP 7.4 or higher
* POTAL API key ([get one free](https://www.potal.app/dashboard))

== Installation ==

1. Upload the `potal-landed-cost` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to **WooCommerce → Settings → POTAL Landed Cost**
4. Enter your API key from [potal.app/dashboard](https://www.potal.app/dashboard)
5. Set your origin country (where you ship from)
6. Choose widget position (before/after add to cart, shortcode only)
7. Optionally enable DDP checkout to include duties in the cart total

== Frequently Asked Questions ==

= Do I need a paid plan? =

POTAL offers a free tier with 200 calculations per month. Paid plans start at $20/month for 2,000 calculations.

= Which countries are supported? =

All 240+ countries and territories recognized by ISO 3166. Duty rates are sourced from government APIs (USITC, UK Trade Tariff, EU TARIC, Canada CBSA, Australia ABF, Japan Customs, Korea KCS) and MacMap/WTO data.

= Does it work with WooCommerce Blocks? =

Yes! The plugin is fully compatible with the block-based cart and checkout introduced in WooCommerce 8.3+.

= How accurate are the duty rates? =

Each calculation includes a confidence score. With HS code classification and live government API data, accuracy typically exceeds 95%. The 4-stage fallback system ensures the best available rate is always used.

= Can I use it with variable/grouped products? =

Yes. The widget automatically detects the active variation price and recalculates.

== Screenshots ==

1. Product page widget showing Total Landed Cost breakdown
2. Settings page with API key configuration
3. DDP checkout with duties included in cart total
4. Multi-currency display example

== Changelog ==

= 1.1.0 =
* WooCommerce Blocks compatibility (cart & checkout blocks)
* 4-stage duty rate fallback (AGR → MIN → NTLC → MFN)
* Trade remedy (AD/CVD/Safeguard) detection
* Section 301/232 tariff support
* Insurance and brokerage fee estimates
* Confidence score in widget display
* DDP/DDU shipping terms support
* EU IOSS, UK reverse charge, AU LVG GST handling
* WordPress.org readme standards compliance

= 1.0.0 =
* Initial release
* Product page widget
* DDP checkout integration
* REST API proxy
* Shortcode support

== Upgrade Notice ==

= 1.1.0 =
Major update: WooCommerce Blocks support, 4-stage duty rate fallback, trade remedies, and much more. Recommended for all users.
