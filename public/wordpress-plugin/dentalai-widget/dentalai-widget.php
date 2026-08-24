<?php
/**
 * Plugin Name: DentalAI Chatbot
 * Plugin URI: https://dentalai.test
 * Description: Official DentalAI widget integration. Adds your AI receptionist to your WordPress site.
 * Version: 1.0.0
 * Author: DentalAI
 * Author URI: https://dentalai.test
 * License: GPL-2.0+
 */

// Exit if accessed directly (Security: avoid exposing secrets or paths)
if (!defined('ABSPATH')) {
    exit;
}

class DentalAI_Widget {

    private $option_name = 'dentalai_clinic_id';
    
    // In a real environment, this would be dynamic or point to the production endpoint
    private $script_url = 'https://dentalai.test/widget.js';

    public function __construct() {
        add_action('admin_menu', array($this, 'add_plugin_page'));
        add_action('admin_init', array($this, 'page_init'));
        add_action('wp_footer', array($this, 'inject_widget_script'), 9999);
    }

    public function add_plugin_page() {
        // Add top level menu
        add_menu_page(
            'DentalAI Settings', 
            'DentalAI', 
            'manage_options', 
            'dentalai-widget', 
            array($this, 'create_admin_page'),
            'dashicons-format-chat',
            80
        );
    }

    public function create_admin_page() {
        // Render the admin dashboard
        ?>
        <div class="wrap">
            <h1>DentalAI Chatbot Integration</h1>
            <p>Connect your website to your DentalAI receptionist.</p>
            <form method="post" action="options.php">
            <?php
                // This prints out all hidden setting fields
                settings_fields('dentalai_option_group');
                do_settings_sections('dentalai-widget-admin');
                submit_button('Save Integration Settings');
            ?>
            </form>
        </div>
        <?php
    }

    public function page_init() {
        register_setting(
            'dentalai_option_group',
            $this->option_name,
            array(
                'sanitize_callback' => array($this, 'sanitize_clinic_id')
            )
        );

        add_settings_section(
            'dentalai_setting_section',
            'Widget Configuration',
            array($this, 'section_info'),
            'dentalai-widget-admin'
        );

        add_settings_field(
            'clinic_id',
            'Public Clinic ID',
            array($this, 'clinic_id_callback'),
            'dentalai-widget-admin',
            'dentalai_setting_section'
        );
    }

    /**
     * Sanitize and validate the input
     */
    public function sanitize_clinic_id($input) {
        $sanitized = sanitize_text_field($input);
        
        if (!empty($sanitized) && !preg_match('/^[a-zA-Z0-9\-]+$/', $sanitized)) {
            add_settings_error(
                $this->option_name,
                'invalid_clinic_id',
                'Invalid Clinic ID format. It should contain only letters, numbers, and hyphens.'
            );
            return get_option($this->option_name); // Revert to old value
        }
        
        return $sanitized;
    }

    public function section_info() {
        echo 'Enter your public clinic ID below. This identifier is safe to be public and does not expose private clinic data or API keys.';
    }

    public function clinic_id_callback() {
        $val = get_option($this->option_name);
        echo '<input type="text" id="clinic_id" name="'.$this->option_name.'" value="'.esc_attr($val).'" class="regular-text" placeholder="e.g. clinic-1234-abcd" />';
        echo '<p class="description">You can find this ID in your <a href="https://dentalai.test/dashboard/website" target="_blank">DentalAI Dashboard</a>.</p>';
    }

    /**
     * Inject the widget script into the footer safely
     */
    public function inject_widget_script() {
        $clinic_id = get_option($this->option_name);
        
        // Don't load if no ID is configured
        if (empty($clinic_id)) {
            return;
        }

        // Avoid duplicate widget loading if wp_footer runs multiple times
        static $loaded = false;
        if ($loaded) {
            return;
        }
        $loaded = true;

        // Output the script securely
        echo "\n<!-- DentalAI Widget Integration -->\n";
        echo '<script src="' . esc_url($this->script_url) . '" data-widget-id="' . esc_attr($clinic_id) . '" defer></script>' . "\n";
    }
}

// Initialize the plugin
$dentalai_widget = new DentalAI_Widget();
