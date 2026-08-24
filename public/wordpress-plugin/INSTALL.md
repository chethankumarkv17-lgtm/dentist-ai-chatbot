# DentalAI WordPress Plugin

This directory contains the official WordPress integration plugin for DentalAI.

## Deployment

To deploy this plugin for users to download:

1. Compress the `dentalai-widget` directory into a `.zip` file:
   ```bash
   zip -r dentalai-widget.zip dentalai-widget/
   ```
2. Distribute the `dentalai-widget.zip` file directly to clinics, or upload it to the WordPress.org Plugin Repository.

## Testing & Validation Notes

- **Input Validation:** The plugin uses WordPress's native `sanitize_text_field()` and a strict Regular Expression `/^[a-zA-Z0-9\-]+$/` to ensure no malicious XSS payloads can be injected via the Clinic ID.
- **Security:** Checks `defined('ABSPATH')` to prevent direct script execution.
- **Output Escaping:** Uses `esc_url()` and `esc_attr()` when printing the script tag to the DOM.
- **Duplicate Loading:** The `wp_footer` hook injection logic uses a static `$loaded` state boolean. If theme developers improperly call `wp_footer()` multiple times, the widget will strictly only render once, preventing duplicate iframe spawning.
- **No Secrets Exposed:** The plugin strictly only asks for the *Public* Clinic ID. Private API keys or organization IDs are never entered into WordPress.
