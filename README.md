<div align="center">

<br/>

<img src="https://img.shields.io/badge/ClinicOS-2.0.0-2563eb?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIyIDEyaDRhMiAyIDAgMCAxIDIgMnY0YTIgMiAwIDAgMS0yIDJIMiIvPjxwYXRoIGQ9Ik0xIDYgMTIgMmwxMSA0Ii8+PHBhdGggZD0iTTkgMTV2M20zLTN2M20zLTN2MyIvPjwvc3ZnPg==" alt="ClinicOS"/>

<h1>🏥 ClinicOS</h1>

<p><strong>The Professional, Bilingual Clinic Management System</strong></p>

<p>
  Engineered for modern medical practices — from solo practitioners to multi-staff clinics.
  <br/>
  Real-time queues, smart prescriptions, financial analytics, and offline-first architecture.
</p>

<br/>

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-42.x-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-ff69b4?style=flat-square)]()

<br/>

[![Deploy Status](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://github.com/Bavly-Hamdy/Clinic_OS)
[![GitHub Stars](https://img.shields.io/github/stars/Bavly-Hamdy/Clinic_OS?style=for-the-badge&logo=github)](https://github.com/Bavly-Hamdy/Clinic_OS/stargazers)

<br/>

---

</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🖥️ Desktop Application](#️-desktop-application)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#️-environment-variables)
- [🔥 Firebase Configuration](#-firebase-configuration)
- [🤖 AI Integration](#-ai-integration)
- [🔍 SEO & Performance](#-seo--performance)
- [🔒 Security](#-security)
- [⚡ Performance](#-performance)
- [📱 Screenshots](#-screenshots)
- [📜 License](#-license)
- [👨‍💻 Author](#-author)

---

## 🌟 Overview

**ClinicOS** is a **production-grade, full-stack clinic management system** designed to digitize and streamline every aspect of a modern medical practice. It serves a **multi-role, multi-tenant architecture** — where a single deployment manages multiple clinics, each isolated with their own data, settings, and staff.

The system is built with a **bilingual-first design** (Arabic RTL + English LTR), making it uniquely suited for the Egyptian and broader MENA healthcare market.

> **Built by [Bavly Hamdy](https://github.com/Bavly-Hamdy)** as a production-ready SaaS product, not a boilerplate or tutorial project.

### Core Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Offline-First** | Firebase Firestore persistent multi-tab cache — works in low-connectivity clinic environments |
| **Bilingual by Design** | Full Arabic RTL + English LTR with instant switching, no page reload |
| **Role-Based Access** | Three-tier RBAC: `ADMIN` → `DOCTOR` → `RECEPTIONIST` with Firestore security rules |
| **Real-Time Everything** | Firestore `onSnapshot` listeners for instant queue, notification, and appointment updates |
| **Performance First** | Route-based code splitting, lazy loading, and manual vendor chunk bundling |

---

## ✨ Features

### 🩺 Doctor's Clinical Workspace

The heart of the system — a dedicated, distraction-free workspace for conducting medical consultations.

- **Smart Prescription Builder** — Drug search with AI-powered autocomplete. Select dosage form (tablet, capsule, syrup, injection, drops), quantity, frequency (every 8h, 12h, once/day, 4x/day, as needed), timing (before/after meals, on empty stomach), and duration with structured pickers — no free-text errors.
- **Drug Allergy Safety Guard** — Cross-references every prescribed drug against the patient's documented allergies in real-time. Triggers a mandatory confirmation dialog before allowing override.
- **Clinical Notes Suite** — Structured sections for Chief Complaint, Diagnosis, and Additional Notes with auto-save on draft.
- **Vital Signs Tracker** — Records and displays historical trends for weight, BP (systolic/diastolic), blood sugar, and pulse per visit.
- **Medical History Panel** — Quick-access view of the patient's chronic conditions, surgeries, past conditions, and known drug allergies.
- **Session Persistence** — The active patient remains pinned in the workspace regardless of page refresh or session duration, until the doctor explicitly clicks "Complete Visit".

### 📋 Live Patient Queue

Real-time queue management shared between Doctor and Receptionist.

- **One-click "Call Next"** — Atomically moves the next waiting patient to `IN_CLINIC` status and opens them in the Doctor's workspace.
- **Live Status Indicators** — Color-coded badges: `WAITING` → `IN_CLINIC` → `COMPLETED` / `CANCELLED`.
- **Queue Number Assignment** — Auto-incremented per-day queue numbers for each appointment.
- **Patient Self-Tracking Page** — A public, no-login page (`/track`) where patients enter their phone number to see their queue position, estimated wait time, and clinic contact info. No app installation required.

### 🖨️ Stationery-Ready Prescription Printing

- **Pre-printed Letterhead Compatible** — The print layout reserves header/footer space to align with pre-designed clinic stationery.
- **Patient Summary Block** — Auto-fills Name, Age (calculated from DOB), Visit Date, and Diagnosis.
- **Clear Drug Instructions** — Each medication prints with its complete structured instructions in professional clinical language.
- **Browser Print API** — One-click print via the native browser dialog, no PDF library on the critical path.

### 📊 Financial Analytics & Shift Management

- **Revenue Dashboard** — Daily/weekly/monthly revenue vs. expenses charts with net profit/loss calculation.
- **Shift Close Report** — End-of-day financial summary with payments breakdown by visit type and payment method.
- **Expense Logging** — Categorized expense tracking (Supplies, Maintenance, Utilities, Software, Other).
- **PDF Export** — Full shift report exported to PDF via `@react-pdf/renderer`.
- **Configurable Service Pricing** — Per-visit-type fee overrides (New Exam, Consultation, Urgent, Sonar, ECG).

### 👥 Patient Database

- **Comprehensive Profiles** — Name, DOB, gender, blood type, phone, address, and medical history.
- **Visit History** — Full timeline of all past visits with prescriptions, diagnosis, and doctor notes.
- **Prescription History** — All prescriptions with "Repeat Rx" quick-action.
- **Multi-Tenant Isolation** — Each doctor sees only their own patient panel.

### 🔔 Notification System

- **Real-time Push** — Admin can broadcast notifications to individual users or bulk-send to all doctors (e.g., subscription expiry alerts).
- **Notification Bell** — Unread count badge in the header, with mark-as-read and delete functionality.

### ⚙️ Clinic Settings

- **Identity Configuration** — Clinic name, doctor name & title, specialty, address, phone, and working hours.
- **Logo Upload** — Base64 logo stored in Firestore (≤100KB), appears on prescriptions and receipts.
- **Staff Management** — Admin can create/revoke receptionist accounts without losing their own session (secondary Firebase Auth instance pattern).
- **Subscription Management** — Admin dashboard for managing doctor subscriptions, plan types (monthly/yearly), and expiry dates.

### 🌍 Bilingual Interface

- Complete **Arabic (RTL)** and **English (LTR)** support using `i18next`.
- Professional medical terminology in both languages.
- Pixel-perfect RTL layout — margin/padding, border, and border-radius all use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`).
- Instant language switching with `i18n.changeLanguage()` — no page reload.

---

## 🖥️ Desktop Application

ClinicOS is available as a **native Windows Desktop Application** built with **Electron 42**, delivering a full Premium Desktop experience — same power as the web app, packaged into a standalone `.exe` installer.

### ✨ Desktop-Specific Features

| Feature | Description |
|---------|-------------|
| **Frameless Window** | Custom borderless design — no standard OS chrome, pure premium feel |
| **Custom Title Bar** | React-built title bar with Minimize, Maximize, and Close controls with hover animations |
| **Window Dragging** | Native window drag via `-webkit-app-region: drag` on the title bar |
| **System Tray** | App hides to the system tray on close — stays running for quick access |
| **Single Instance Lock** | Only one instance can run — prevents duplicate windows during HMR reloads |
| **Context Isolation** | `nodeIntegration: false` + `contextIsolation: true` — maximum security |
| **Secure IPC Bridge** | `contextBridge` exposes a safe, minimal API from Electron to React |
| **Auto Updates** | `electron-updater` integration for seamless silent background updates |
| **Electron Logging** | `electron-log` persists crash logs and events to disk for diagnostics |
| **External Link Guard** | All `https://` links open in the OS default browser, not inside Electron |
| **Dark / Light Mode** | The custom Title Bar respects the application theme automatically |
| **Graceful Loading** | Window stays hidden until content is fully loaded — zero white flash on startup |

### 🏗️ Electron Architecture

```
clinic-os/
├── 📁 electron/
│   ├── 📄 main.ts       # Main Process — BrowserWindow, Tray, IPC, Auto-Updater
│   └── 📄 preload.ts    # Preload Script — Secure contextBridge API
│
├── 📁 src/
│   └── 📁 components/
│       └── 📄 TitleBar.tsx  # Custom React Title Bar with window controls
│
└── 📁 dist-electron/    # Compiled Electron output (git-ignored)
```

**IPC Communication Map:**

```
Renderer (React)                 Main Process (Electron)
─────────────────                ──────────────────────
window-minimize      ──────►     win.minimize()
window-maximize      ──────►     win.maximize() / win.unmaximize()
window-close         ──────►     win.hide() (→ Tray)
get-app-version      ◄──────     app.getVersion()
show-notification    ──────►     electron-log.info()
```

### 📦 Building the Desktop App

**Option 1 — Development (with HMR):**
```bash
npm run dev
```
*Opens the app directly in an Electron window. Vite HMR works live inside the window.*

**Option 2 — Production Installer (`.exe`):**

> ⚠️ **Important:** Run this in a terminal opened as **Administrator**, or enable **Developer Mode** in Windows Settings → Privacy & Security → For Developers. This is required for Electron Builder to create symlinks during packaging.

```bash
npm run build:electron
```

This produces a professional Windows installer at:
```
release/
└── ClinicOS Setup 2.0.0.exe    ← Professional NSIS installer
```

**Installer Features:**
- Allows user to choose installation directory
- Creates Desktop shortcut
- Creates Start Menu shortcut
- Professional NSIS setup experience

---

## 🔍 SEO & Performance

ClinicOS is fully optimized for search engine indexing and Core Web Vitals.

| Optimization | Implementation |
|---|---|
| **Dynamic Meta Tags** | `react-helmet-async` — each route has its own `<title>`, `<description>`, OG tags |
| **JSON-LD Schema** | 4 structured data schemas: SoftwareApplication, Organization, WebSite, FAQPage |
| **Bilingual Sitemap** | `sitemap.xml` with `hreflang` tags for Arabic and English indexing |
| **robots.txt** | Custom crawler rules optimized for Google, Bing, and social media bots |
| **Preconnect Hints** | Google Fonts loaded with `preconnect` in `<head>` — non-render-blocking |
| **PWA Ready** | Service worker pre-caches all static assets for instant repeat visits |
| **Open Graph** | Full OG + Twitter Card meta tags for rich social sharing previews |

---


```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Landing  │  │  Auth    │  │Dashboard │  │  Admin    │  │
│  │  Page    │  │  Pages   │  │  Pages   │  │  Pages    │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│         │              │             │              │        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Router v6 (Lazy Routes)            │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │          State Layer (TanStack Query + Context)       │  │
│  │  AuthProvider  │  ThemeProvider  │  LanguageProvider  │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │              Firebase SDK (Client-side)               │  │
│  │   Auth  │  Firestore (offline cache)  │  Analytics   │  │
│  └───────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Firebase   │
                    │  Services   │
                    │─────────────│
                    │ Firestore   │
                    │ Auth        │
                    │ Hosting     │
                    └─────────────┘
```

### Multi-Tenant Data Model

```
users/{uid}           → Role, subscription status, doctorId
  └── patients/{id}   → Doctor-owned patient profiles
       └── visits/{id}→ Clinical session data
            └── prescriptions/{id}
appointments/{id}     → Shared queue (public read for /track)
payments/{id}         → Financial records (doctor-scoped)
expenses/{id}         → Expense logs (doctor-scoped)
clinic_settings/{id}  → Per-clinic configuration
notifications/{id}    → User-scoped notifications
subscriptions/{id}    → Admin-managed subscription records
platform_settings/    → Global pricing (public read)
```

### Role-Based Access Control

```
ADMIN
 ├── Full platform management
 ├── Doctor account creation (secondary Auth instance)
 ├── Subscription management
 └── Platform pricing configuration

DOCTOR
 ├── Clinical workspace (exclusive)
 ├── Patient database (own patients only)
 ├── Analytics & financial reports
 └── Clinic settings

RECEPTIONIST (linked to a Doctor)
 ├── Queue management
 ├── Patient registration
 └── Shift close & expense logging
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework with concurrent features |
| **TypeScript** | 5.x | Type safety throughout the entire codebase |
| **Vite** | 5.x | Build tool with HMR and SWC transpilation |
| **Electron** | 42.x | Cross-platform desktop application shell |
| **electron-builder** | 26.x | Packages Electron app into `.exe` / `.dmg` installers |
| **React Router** | 6.x | Client-side routing with lazy loading (HashRouter in Electron) |
| **TanStack Query** | 5.x | Server state management and caching |
| **Tailwind CSS** | 3.x | Utility-first styling with RTL logical properties |
| **Shadcn/UI** | — | Accessible, headless component system |
| **Radix UI** | — | Accessible primitives (dialogs, dropdowns, etc.) |
| **Framer Motion** | 12.x | Smooth page and element animations |
| **i18next** | 25.x | Full internationalization (AR + EN) |
| **date-fns** | 3.x | Date arithmetic and formatting |
| **Recharts** | 2.x | Financial analytics charts |
| **@react-pdf/renderer** | 4.x | Shift report PDF generation |
| **react-helmet-async** | 3.x | Dynamic SEO meta tag management per route |
| **Lucide React** | — | Consistent icon system |
| **Zod** | 3.x | Runtime schema validation |

### Backend & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Firebase Auth** | Multi-role authentication with secondary instance for admin actions |
| **Cloud Firestore** | Real-time NoSQL database with offline-persistent multi-tab cache |
| **Firestore Security Rules** | Server-side RBAC — denies unauthorized access at the database level |
| **Vercel** | Edge-network deployment with automatic CI/CD from GitHub |

### AI Integration

| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | Drug name autocomplete and concentration suggestions for rare medications |

---

## 📁 Project Structure

```
clinic-os/
├── 📄 index.html                 # App shell with PWA + SEO meta tags
├── 📄 vite.config.ts             # Build config with Electron + manual chunk splitting
├── 📄 tailwind.config.ts         # Design system tokens
├── 📄 firestore.rules            # Server-side Firestore security rules
├── 📄 .env.local                 # Local environment variables (never committed)
│
├── 📁 electron/                  # ★ Electron Desktop Application
│   ├── 📄 main.ts               # Main Process (BrowserWindow, Tray, IPC, AutoUpdater)
│   └── 📄 preload.ts            # Preload script (Secure contextBridge)
│
├── 📁 public/
│   ├── icons/                    # PWA + Desktop icons (192x192, 512x512)
│   ├── 📄 sitemap.xml            # Bilingual SEO sitemap with hreflang
│   └── 📄 robots.txt            # Crawler access configuration
│
└── 📁 src/
    ├── 📄 main.tsx               # Entry point — StrictMode + root guard
    ├── 📄 App.tsx                # Router (HashRouter) + providers + lazy page loading
    │
    ├── 📁 lib/
    │   ├── 📄 firebase.ts        # Firebase initialization + env validation
    │   ├── 📄 constants.ts       # App-wide constants (collections, keys, etc.)
    │   ├── 📄 i18n.ts            # Bilingual translations (AR + EN)
    │   ├── 📄 utils.ts           # Shared utility functions
    │   └── 📁 schemas/
    │       └── 📄 patient.ts     # Zod validation schemas
    │
    ├── 📁 types/
    │   └── 📄 clinic.ts          # All TypeScript interfaces and types
    │
    ├── 📁 providers/
    │   ├── 📄 AuthProvider.tsx   # Firebase Auth state + user cache
    │   ├── 📄 ThemeProvider.tsx  # Light/dark theme context
    │   └── 📄 LanguageProvider.tsx # RTL/LTR language context
    │
    ├── 📁 layouts/
    │   ├── 📄 DashboardLayout.tsx # Sidebar + header + mobile nav
    │   └── 📄 AdminLayout.tsx     # Admin-specific layout
    │
    ├── 📁 components/
    │   ├── 📄 TitleBar.tsx        # ★ Custom Electron title bar with window controls
    │   ├── 📄 SEO.tsx             # ★ Dynamic SEO meta tag component (react-helmet-async)
    │   ├── 📄 AppSidebar.tsx      # Navigation sidebar with live stats
    │   ├── 📄 ProtectedRoute.tsx  # RBAC route guard
    │   ├── 📄 NotificationBell.tsx # Real-time notification center
    │   ├── 📄 PatientRegistrationDialog.tsx
    │   ├── 📄 PrintPrescriptionButton.tsx
    │   ├── 📄 ShiftClosePDF.tsx   # PDF report renderer
    │   └── 📁 ui/                 # Shadcn/Radix UI components
    │
    ├── 📁 hooks/
    │   ├── 📄 useNotifications.ts # Real-time notification hook
    │   ├── 📄 useSubscriptions.ts # Subscription management hook
    │   ├── 📄 useAdminDoctors.ts  # Doctor list for admin
    │   ├── 📄 usePlatformPricing.ts
    │   ├── 📄 useDebounce.ts      # Input debounce utility
    │   ├── 📄 useMobile.tsx       # Responsive breakpoint hook
    │   └── 📄 useToast.ts         # Toast notification hook
    │
    ├── 📁 pages/
    │   ├── 📄 LandingPage.tsx     # Public marketing page
    │   ├── 📄 LoginPage.tsx       # Authentication page
    │   ├── 📄 TrackQueuePage.tsx  # Public patient queue tracker
    │   ├── 📄 RegistrationPage.tsx # Subscription sign-up
    │   ├── 📄 DashboardHome.tsx   # Role-aware dashboard
    │   │
    │   ├── 📁 doctor/
    │   │   ├── 📄 WorkspacePage.tsx    # Clinical workspace (largest page)
    │   │   ├── 📄 AnalyticsPage.tsx   # Financial analytics
    │   │   └── 📄 SettingsPage.tsx    # Clinic configuration
    │   │
    │   ├── 📁 receptionist/
    │   │   ├── 📄 QueuePage.tsx       # Patient queue management
    │   │   └── 📄 ShiftClosePage.tsx  # Shift financial close
    │   │
    │   ├── 📁 shared/
    │   │   ├── 📄 PatientsPage.tsx    # Patient database
    │   │   ├── 📄 PatientDetailPage.tsx
    │   │   └── 📄 ProfilePage.tsx
    │   │
    │   └── 📁 admin/
    │       ├── 📄 AdminDashboardPage.tsx
    │       ├── 📄 DoctorManagementPage.tsx
    │       ├── 📄 SubscriptionManagementPage.tsx
    │       └── 📄 PricingManagementPage.tsx
    │
    └── 📁 test/
        ├── 📄 setup.ts
        └── 📄 example.test.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>=18.0.0`
- **npm** `>=9.0.0`
- A **Firebase project** with Firestore and Authentication enabled
- A **Google Gemini API key** (for drug autocomplete)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Bavly-Hamdy/Clinic_OS.git
cd Clinic_OS

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see below)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Available Scripts

```bash
npm run dev            # Start Electron desktop app (Vite dev server + Electron window)
npm run build          # Production web build (outputs to /dist)
npm run build:electron # Build + package into Windows .exe installer (needs Admin)
npm run preview        # Preview web production build locally
npm run lint           # ESLint code quality check
npm run test           # Run unit tests (Vitest)
npm run test:watch     # Run tests in watch mode
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```env
# ── Firebase Configuration ────────────────────────────────────────────
# Get these from: Firebase Console → Project Settings → Your Apps → Config
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ── Google Gemini AI ──────────────────────────────────────────────────
# Get from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_key_here
```

> ⚠️ **Security Note:** The `VITE_` prefix makes these variables available in the browser bundle. These Firebase client keys are safe to expose — they are protected by Firestore Security Rules and Firebase Auth, not by key secrecy. The Gemini key should be treated as a private key; consider proxying it through a backend function in a high-traffic production environment.

---

## 🔥 Firebase Configuration

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → Follow the setup wizard
3. Enable **Google Analytics** (optional)

### 2. Enable Services

```
Firebase Console → Build → Authentication
  → Sign-in method → Email/Password → Enable

Firebase Console → Build → Firestore Database
  → Create database → Start in production mode
  → Choose region (e.g., europe-west1 for lowest latency in MENA)
```

### 3. Deploy Security Rules

The `firestore.rules` file in the repository contains the complete, production-hardened security rules. Deploy them via Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy rules
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

### 4. Create the First Admin Account

Navigate to `/setup-admin` after deployment to bootstrap the first admin user. **Remove or protect this route after initial setup.**

---

## 🤖 AI Integration

ClinicOS uses **Google Gemini 1.5 Flash** for intelligent drug name autocomplete in the Prescription Builder.

### How It Works

```
User types drug name
       │
       ▼
Local drug dictionary (instant, offline)
       │
   No match?
       │
       ▼
Gemini API call with clinical prompt
       │
       ▼
Returns: drug name, generic name,
         standard concentrations, form
       │
       ▼
Displayed as autocomplete suggestions
```

### Rate Limiting & Fallback

- Requests are **debounced** (300ms) to avoid excessive API calls
- A **cooldown mechanism** detects rate limit (429) responses and suspends Gemini calls temporarily
- The local dictionary always serves as the primary and fallback source
- All Gemini usage is client-side with the API key secured via environment variable

---

## 🔒 Security

### Authentication & Authorization

```
Firebase Auth (JWT-based)
  └── User signs in
  └── onAuthStateChanged fetches Firestore user doc
  └── Role is embedded in the user document
  └── ProtectedRoute checks role before rendering
  └── Firestore Rules enforce role on every DB operation
```

### Firestore Security Rules Architecture

The `firestore.rules` implements **deny-by-default with explicit allowances**:

- **Public** read: `appointments` (for `/track` page), `platform_settings` (for pricing)
- **Authenticated** read/write: `patients`, `visits`, `prescriptions`, `payments`, `expenses`, `clinic_settings`
- **Admin-only** write: `subscriptions`, `notifications`, `platform_settings`
- **User-scoped**: Notifications — users can only read/modify their own
- **Default**: Deny — any collection not explicitly listed is inaccessible

### Client-Side Security Measures

| Measure | Implementation |
|---------|---------------|
| **Environment Validation** | `firebase.ts` crashes with a descriptive error if any `VITE_FIREBASE_*` var is missing — prevents silent undefined values |
| **Cache Sanitization** | `localStorage` only stores non-sensitive user fields — no tokens, no passwords |
| **Secondary Auth Instance** | Admin account creation uses an isolated Firebase app instance, preventing admin session hijacking |
| **Role Verification** | Both client-side (`ProtectedRoute`) and server-side (Firestore Rules) enforce RBAC |

---

## ⚡ Performance

### Bundle Splitting Strategy

The production build uses **Rollup manual chunks** to split the 4MB+ monolithic bundle into focused vendor chunks, dramatically improving initial load time.

```
vendor-react     │ 282 KB │ React, React-DOM, React-Router — critical path
vendor-radix     │ 136 KB │ UI primitives — needed for all dashboard pages
vendor-motion    │ 135 KB │ Framer Motion — only downloaded on Landing/Login
vendor-firebase  │ 620 KB │ Firebase SDK — async, cached aggressively
vendor-charts    │ 385 KB │ Recharts + D3 — only downloaded on Analytics page
vendor-pdf       │ 1.5 MB │ PDF renderer — only downloaded on Shift Close page
```

**Result:** Users visiting the Login or Dashboard pages download **~400KB** instead of 4.1MB.

### Other Optimizations

- **React.lazy + Suspense** — Every route is code-split. Pages are downloaded on-demand.
- **TanStack Query** — Intelligent server state caching with 30-second stale time and no unnecessary refetches.
- **Firestore Offline Cache** — `persistentLocalCache` with `persistentMultipleTabManager` enables offline functionality and eliminates redundant network reads.
- **Debounced Search** — Drug name and patient search inputs are debounced to prevent excessive Firestore queries.
- **PWA** — Service worker pre-caches all static assets. Subsequent visits load instantly from cache.

---

## 📱 Screenshots

> *The following sections are reserved for application screenshots.*

### Landing Page
![Landing Page](./docs/screenshots/landing.png)

### Doctor's Clinical Workspace
![Workspace](./docs/screenshots/workspace.png)

### Live Patient Queue
![Queue](./docs/screenshots/queue.png)

### Prescription Builder
![Prescription](./docs/screenshots/prescription.png)

### Financial Analytics Dashboard
![Analytics](./docs/screenshots/analytics.png)

### Patient Queue Tracker (Public)
![Track Page](./docs/screenshots/track.png)

---

## 🗺️ Roadmap

- [x] **Desktop Application** — Native Windows `.exe` via Electron with custom title bar
- [ ] **Digital Signature** — Capture/upload doctor signature on prescriptions
- [ ] **WhatsApp Notifications** — Automated appointment reminders via WhatsApp API
- [ ] **Multi-clinic Support** — One doctor account managing multiple clinic branches
- [ ] **DICOM Viewer** — Basic integration for radiology image viewing
- [ ] **Telemedicine Module** — Video consultation integration
- [ ] **Mobile App** — React Native companion app for Android/iOS

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

```bash
# Fork the repository, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

## 👨‍💻 Author

<img src="https://avatars.githubusercontent.com/Bavly-Hamdy" width="100" style="border-radius: 50%;" alt="Bavly Hamdy"/>

### Bavly Hamdy

*Full-Stack Software Engineer*

[![GitHub](https://img.shields.io/badge/GitHub-Bavly--Hamdy-181717?style=for-the-badge&logo=github)](https://github.com/Bavly-Hamdy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bavly%20Hamdy-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/bavly-hamdy/)

<br/>

---

<p>
  <strong>ClinicOS</strong> — Built with ❤️ for the Egyptian medical community
  <br/>
  <sub>© 2026 Bavly Hamdy. All rights reserved.</sub>
</p>

</div>
