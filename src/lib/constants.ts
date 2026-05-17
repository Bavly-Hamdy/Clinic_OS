/**
 * App-wide constants for Clinic Hub.
 * Centralizing magic strings here prevents typos and makes refactoring trivial.
 */

// ── LocalStorage Keys ─────────────────────────────────────────────────────────
export const USER_CACHE_KEY = 'Clinic Hub_user_cache' as const;

// ── Firestore Collection Names ────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS:                 'users',
  PATIENTS:              'patients',
  APPOINTMENTS:          'appointments',
  VISITS:                'visits',
  PRESCRIPTIONS:         'prescriptions',
  PAYMENTS:              'payments',
  EXPENSES:              'expenses',
  NOTIFICATIONS:         'notifications',
  CLINIC_SETTINGS:       'clinic_settings',
  VITAL_SIGNS:           'vital_signs',
  SUBSCRIPTIONS:         'subscriptions',
  PLATFORM_SETTINGS:     'platform_settings',
  REGISTRATION_REQUESTS: 'registration_requests',
} as const;


// ── React Query Defaults ──────────────────────────────────────────────────────
export const QUERY_STALE_TIME = 30_000; // 30 seconds
export const QUERY_RETRY_COUNT = 1;

// ── App Metadata ──────────────────────────────────────────────────────────────
export const APP_NAME    = 'Clinic Hub' as const;
export const APP_VERSION = '2.0.0'   as const;

export const PLATFORM_SUPPORT_NUMBERS = [
  '201111835471',
  '201153762560'
] as const;
