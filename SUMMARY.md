# Project Summary: Employee Management System (EMS)

This document provides a concise summary of the technologies used and the core technical highlights of the Employee Management System (EMS) project.

---

## 1. What We Have Used (The Tech Stack)

### Backend (Node.js & Express)
*   **Express.js:** Serving static pages, routing REST APIs, handling body parsing (`express.json()`), and routing middlewares.
*   **Node.js Core APIs:** `crypto` (for secure session tokens generation), `path` (for file system path mapping).

### Relational Database
*   **SQLite3:** Local, file-contained SQL database storing credentials, metadata, and roles (`database.sqlite`).
*   **sqlite3 driver:** Node.js native bindings for SQLite executing parameters-safe queries.

### Security & Cryptography
*   **Bcrypt (`bcryptjs`):** Asynchronous hashing and salting (using a cost factor of `10`) to protect raw password integrity.
*   **Cookie-based Auth:** Custom cookie-parser and HTTP session mapping. Cookies set with `HttpOnly` and `SameSite=Lax` properties.

### Frontend
*   **HTML5:** Structured semantic markup for pages (Dashboard, Admin controls, Employee listings, Payroll logs).
*   **Vanilla CSS3:** Native styling with custom variables, grid templates, flexible layout systems, hover states, and dynamic status badges.
*   **Vanilla JavaScript (ES6+):** Client-side navigation trimming, LocalStorage management, dynamic table row DOM creation, and response handling.
*   **Third-party CDNs:** FontAwesome icons and Google Fonts (Inter).

---

## 2. The Important Stuff (Technical & Security Highlights)

### Custom Session Store
*   Sessions are tracked using a server-side JavaScript `Map()`.
*   Incoming requests have their headers parsed for cookies using a custom regex-less parsing helper.

### Double-Guarded RBAC (Role-Based Access Control)
*   **Client-Side:** Navigation links are filtered based on `localStorage.getItem('currentUserRole')`. Unprivileged redirects block pages.
*   **Server-Side:** Custom Express middleware intercepts static routes and checks API actions (`requireAdminApi`), returning `403 Forbidden` if session role is unauthorized.

### Database Parameterization
*   Queries avoid string-concatenation to completely mitigate SQL injection vectors. Placeholders (`?`) are bound to request params automatically.

### Automated Seeding
*   On startup, the SQLite database verifies the presence of an administrator. If absent, the server automatically seeds the database with a default admin (`admin`/`admin123`).
