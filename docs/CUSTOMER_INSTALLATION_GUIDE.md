# Radiant Nobel — Clinic Installation & Integration Guide

Welcome to Radiant Nobel! This guide provides step-by-step instructions for clinic owners and website administrators to install the AI Receptionist chat widget, configure custom domains, connect calendar schedules, and customize dental services.

---

## 1. Fast JavaScript Widget Embed (Any Website)

To embed the AI receptionist on any HTML, Squarespace, Wix, Webflow, or Shopify website, copy and paste this single line before the closing `</body>` tag:

```html
<!-- Radiant Nobel AI Receptionist Widget -->
<script 
  src="https://radiantnobel.com/widget.js" 
  data-clinic="YOUR_CLINIC_ID" 
  async
></script>
```

> **Where to find your Clinic ID**: Log in to your Radiant Nobel Dashboard $\rightarrow$ **Chatbot** $\rightarrow$ **Embed Code**.

---

## 2. WordPress Plugin Installation

If your dental clinic runs on WordPress:

1. In your WordPress Admin sidebar, go to **Plugins** $\rightarrow$ **Add New** $\rightarrow$ **Upload Plugin**.
2. Upload the `dentalai-widget.zip` file (downloadable from your Dashboard $\rightarrow$ **Chatbot**).
3. Click **Install Now** and **Activate Plugin**.
4. Navigate to **Settings** $\rightarrow$ **DentalAI Widget** in your WordPress sidebar.
5. Enter your **Clinic ID** and click **Save Changes**.
6. *(Optional)* To display the widget as an inline booking card on any page or blog post, use the shortcode:
   ```
   [dentalai_widget]
   ```

---

## 3. Google Tag Manager (GTM) Installation

If your practice manages website scripts via Google Tag Manager:

1. Open your **GTM Workspace** and click **New Tag**.
2. Select **Tag Type**: **Custom HTML**.
3. Paste the embed script:
   ```html
   <script src="https://radiantnobel.com/widget.js" data-clinic="YOUR_CLINIC_ID" async></script>
   ```
4. Set **Triggering**: **All Pages** (or specific landing pages).
5. Click **Save** and **Submit / Publish** your GTM container.

---

## 4. Built-in Clinic Website Builder

If you do not have an existing website or want an ultra-fast modern dental landing page:

1. Go to **Dashboard** $\rightarrow$ **Site Builder**.
2. Choose a pre-designed healthcare theme (Modern Clean, Classic Dental, Slate Minimal).
3. Upload your clinic logo and staff photos.
4. Add your services, practitioner bios, business hours, and clinic location.
5. Click **Publish Website**. Your site will immediately be live at `https://[your-clinic-slug].dentalai.site`.

---

## 5. Custom Domain & DNS Setup

To use your own domain name (e.g. `booking.yourdentalclinic.com` or `yourdentalclinic.com`):

1. Go to **Dashboard** $\rightarrow$ **Domains**.
2. Enter your custom domain name and click **Add Domain**.
3. Log in to your domain registrar (GoDaddy, Namecheap, Google Domains/Squarespace, Cloudflare) and add the following DNS records:

| Record Type | Name / Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **CNAME** | `booking` (or `@` for root) | `cname.vercel-dns.com` | Routes traffic to your clinic site |
| **TXT** | `_radiantnobel-challenge` | *(Given in Dashboard)* | Verifies domain ownership |

4. Return to the Dashboard and click **Verify Domain**. SSL certificates are issued automatically within a few minutes.

---

## 6. Two-Way Calendar Integration

To ensure the AI only books appointments during genuine open slots and automatically blocks personal breaks:

### Google Calendar Setup
1. Go to **Dashboard** $\rightarrow$ **Calendar** $\rightarrow$ **Google Calendar**.
2. Click **Connect Google Calendar** and authorize access with your Google account.
3. Select which calendar to sync bookings into.

### Microsoft Outlook 365 Setup
1. Go to **Dashboard** $\rightarrow$ **Calendar** $\rightarrow$ **Outlook 365**.
2. Click **Connect Microsoft Account** and sign in with your Office 365 practitioner account.

---

## 7. Managing Subscriptions & Billing

1. Go to **Dashboard** $\rightarrow$ **Billing**.
2. View your active subscription tier (Starter, Professional, Enterprise) and monthly AI conversation usage.
3. Click **Manage Billing & Invoices** to open the secure Stripe Customer Portal where you can update credit cards, download PDF tax invoices, or upgrade plans.

---

## 8. Troubleshooting & FAQ

### Q: Why is the chat widget not appearing on my website?
- Ensure the script tag has your correct `data-clinic` UUID.
- Check that your browser or adblocker is not blocking third-party iframes.
- Open Developer Tools Console (`F12`) to verify there are no content security policy (CSP) errors.

### Q: How does the AI prevent double bookings?
- Radiant Nobel enforces database-level mutex locks and unique slot constraints. If two patients attempt to book the exact same opening simultaneously, only one succeeds and the second is immediately offered alternative available times.

### Q: How do I contact technical support?
- Go to **Dashboard** $\rightarrow$ **Support** to submit a support ticket directly to our engineering team.
