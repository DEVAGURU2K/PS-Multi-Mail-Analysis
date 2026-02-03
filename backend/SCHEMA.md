# Database Schema Documentation

This document describes the MongoDB collections used in the Property Monitor application, implemented using Mongoose.

## Collections

- [Users](#users)
- [Mailboxes](#mailboxes)
- [Properties](#properties)

---

## Users
Stores user accounts for authentication.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `String` | Yes | Unique email address for login. |
| `password` | `String` | Yes | Hashed password. |
| `createdAt` | `Date` | - | Formatted by `timestamps: true`. |
| `updatedAt` | `Date` | - | Formatted by `timestamps: true`. |

---

## Mailboxes
Stores email account configurations for monitoring.

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `owner` | `ObjectId` | Yes | - | Reference to `User` collection. |
| `email` | `String` | Yes | - | Email address to monitor. |
| `password` | `String` | Yes | - | Encrypted IMAP password. |
| `host` | `String` | Yes | `imap.gmail.com` | IMAP server host. |
| `port` | `Number` | Yes | `993` | IMAP server port. |
| `tls` | `Boolean` | Yes | `true` | Use TLS for connection. |
| `isActive` | `Boolean` | No | `true` | Whether the stream is active. |
| `lastChecked` | `Date` | No | - | Last time emails were fetched. |

---

## Properties
Stores extracted property listing data.

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `owner` | `ObjectId` | Yes | - | Reference to `User` collection. |
| `title` | `String` | No | - | Title of the property. |
| `source` | `String` | Yes | `email` | Source of data (`email`, `web`, `manual`). |
| `link` | `String` | Yes | - | Unique URL to the property listing. |
| `raw_email_id`| `String` | No | - | Message ID if source is email. |
| `sender` | `String` | No | - | Sender of the email. |
| `receivedAt` | `Date` | No | `Date.now` | Time data was received. |
| `extracted_data`| `Object` | Yes | - | Nested object with AI/Regex extracted fields. |
| `extracted_data.rent` | `String` | No | - | Extracted rent amount. |
| `extracted_data.bhk` | `String` | No | - | Extracted BHK details (e.g., "2 BHK"). |
| `extracted_data.address` | `String` | No | - | Extracted address. |
| `extracted_data.unit_type`| `String` | No | - | Type of unit (e.g., "Apartment"). |
| `extracted_data.size` | `String` | No | - | Size of the property (e.g., "1200 sqft"). |
| `extracted_data.description`| `String` | No | - | Short description of the property. |
| `status` | `String` | No | `new` | Status (`new`, `processed`, `archived`). |
