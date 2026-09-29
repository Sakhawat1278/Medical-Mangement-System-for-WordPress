=== E-CARE Management System ===
Contributors: sakhawat1278
Donate link: https://wordpress.org
Tags: clinic, hospital management, appointment booking, telemedicine, patient portal, blood bank
Requires at least: 5.8
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A comprehensive clinic and hospital management system featuring a modern patient portal, appointment booking, telemedicine, and blood bank.

== Description ==

**E-CARE Management System** is a modern, enterprise-grade healthcare and clinic management platform built specifically for WordPress. It provides complete style isolation, high-performance structured database storage, and a rich, responsive interface for patients, doctors, and clinical administrators.

### Core Features

* **Patient & Clinical Portal**: Complete dashboard for patients, doctors, nurses, receptionists, and clinic administrators.
* **Appointment Scheduling & Lifecycle**: Multi-step booking, doctor availability slots, rescheduling, and status transitions (Pending, Confirmed, Completed, Cancelled).
* **Telemedicine & Video Consultation**: Embedded WebRTC video consultations with doctor-patient consultation rooms supporting Agora, Daily.co, and Jitsi Meet.
* **Blood Bank & Emergency Donor Management**: Real-time blood group inventory (ABO/Rh), donor registration, emergency blood requisition, and donation drive management.
* **Inpatient Department (IPD) & Ward Management**: Wards, bed allocation, floor plans, and admission monitoring.
* **Care Providers & Home Nursing**: Support for specialized home care services including physiotherapists, nurses, senior caregivers, and nannies.
* **Ambulance Dispatch**: Emergency ambulance fleet booking and request coordination.
* **WooCommerce Checkout & Billing**: Seamless integration with WooCommerce cart and payment gateways for clinical services, lab tests, and appointments.
* **Elementor Widgets**: Native Elementor widgets for doctor search, services, reviews carousel, blood bank inventory, and account navigation.
* **Privacy & GDPR Compliant**: Built-in support for WordPress Personal Data Exporter and Personal Data Eraser.

== External Services & Privacy Policy ==

This plugin provides integrations with external third-party communication and cloud services. These services are only invoked when configured or explicitly utilized by the administrator or users:

1. **Agora RTC (Agora.io)**
   * **Purpose**: Generates secure real-time audio and video consultation tokens and handles WebRTC communication for doctor-patient telemedicine calls.
   * **Data Sent**: Channel/room identifier, user numeric role identifier, and timestamp.
   * **Terms of Service**: https://www.agora.io/en/terms-of-service/
   * **Privacy Policy**: https://www.agora.io/en/privacy-policy/

2. **Daily.co**
   * **Purpose**: Telemedicine WebRTC video consultation rooms and secure meeting access tokens.
   * **Data Sent**: Room name, session duration, and token claims for scheduled consultations.
   * **Terms of Service**: https://www.daily.co/terms/
   * **Privacy Policy**: https://www.daily.co/privacy/

3. **Jitsi Meet (meet.jit.si)**
   * **Purpose**: Free and open-source video meeting room bridge for telemedicine consultations.
   * **Data Sent**: Generated consultation room name and display nickname.
   * **Privacy Policy**: https://jitsi.org/meet-jit-si-privacy/

4. **Firebase (Google Cloud)**
   * **Purpose**: Optional real-time authentication and mobile push notifications for appointment alerts.
   * **Data Sent**: User authentication tokens and notification message payloads.
   * **Terms of Service**: https://firebase.google.com/terms/
   * **Privacy Policy**: https://policies.google.com/privacy

== Installation ==

1. Upload the `e-care-management-system` folder to your `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Navigate to **E-CARE** in the WordPress admin menu to complete the initial setup wizard.
4. Add the `[ecare_portal]` shortcode or assign the E-CARE Portal template to your desired page.
5. (Optional) Customize colors, logos, and communication credentials in the E-CARE Setup settings.

== Frequently Asked Questions ==

= Does E-CARE require WooCommerce? =
No. E-CARE includes a built-in billing and payment tracking module. WooCommerce is completely optional and can be enabled if you wish to route payments through WooCommerce payment gateways.

= Does E-CARE require Elementor? =
No. The clinical portal and booking pages function independently. Elementor widgets are provided as an added convenience for building custom landing pages.

= Is patient medical data secure? =
Yes. All clinical documents and private medical attachments are stored in a protected storage directory with restricted access and strict user capability verification.

== Screenshots ==

1. screenshot-1.png: Clinical Portal Dashboard with live metrics and appointments.
2. screenshot-2.png: Doctor availability and consultation scheduler.
3. screenshot-3.png: Real-time Blood Bank inventory and donor registration.
4. screenshot-4.png: Telemedicine video consultation room.

== Changelog ==

= 1.0.0 =
* Initial public release on WordPress.org.
* Complete clinical workflow engine with appointments, patients, and staff.
* Integrated telemedicine, blood bank, lab tests, and IPD ward management.
* Full GDPR compliance with WordPress personal data export and erasure hooks.
* Localized asset loading conforming to WordPress.org privacy standards.
