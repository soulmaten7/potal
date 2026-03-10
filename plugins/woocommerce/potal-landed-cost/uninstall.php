<?php
/**
 * POTAL Landed Cost — Uninstall
 *
 * Cleans up all plugin options and cached data when the plugin is deleted.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) exit;

// Remove plugin options
delete_option('potal_api_key');
delete_option('potal_seller_id');
delete_option('potal_origin_country');
delete_option('potal_widget_position');
delete_option('potal_enable_ddp');

// Clear cached API responses
global $wpdb;
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_potal_calc_%' OR option_name LIKE '_transient_timeout_potal_calc_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_potal_ddp_%' OR option_name LIKE '_transient_timeout_potal_ddp_%'");
