// src/lib/constants.js
// Single source of truth for all magic values in the app.

export const ROLES = {
  CITIZEN: 'citizen',
  ADMIN: 'admin',
}

export const ISSUE_STATUS = {
  REPORTED:    'reported',
  VERIFIED:    'verified',
  IN_PROGRESS: 'in_progress',
  RESOLVED:    'resolved',
}

export const ISSUE_CATEGORY = {
  ROADS:       'roads',
  GARBAGE:     'garbage',
  WATER:       'water',
  LIGHTING:    'lighting',
  ENCROACHMENT:'encroachment',
  OTHER:       'other',
}

export const SEVERITY = {
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
}

// Status badge colors (Tailwind classes)
export const STATUS_COLORS = {
  reported:    'bg-red-100 text-red-700 border-red-200',
  verified:    'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved:    'bg-green-100 text-green-700 border-green-200',
}

// Status badge labels
export const STATUS_LABELS = {
  reported:    'Reported',
  verified:    'Verified',
  in_progress: 'In Progress',
  resolved:    'Resolved',
}

// Severity badge colors
export const SEVERITY_COLORS = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
}

// Map marker colors by status
export const MARKER_COLORS = {
  reported:    '#EF4444', // red
  verified:    '#3B82F6', // blue
  in_progress: '#F59E0B', // amber
  resolved:    '#22C55E', // green
}

// Category icons (lucide-react icon names)
export const CATEGORY_ICONS = {
  roads:        'Construction',
  garbage:      'Trash2',
  water:        'Droplets',
  lighting:     'Lightbulb',
  encroachment: 'ShieldAlert',
  other:        'AlertCircle',
}

// Duplicate detection radius in metres
export const DUPLICATE_RADIUS_M = 500

// Image upload constraints
export const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5MB
export const IMAGE_ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp']

// Issue submission rate limit (ms between submissions per user)
export const REPORT_COOLDOWN_MS = 5 * 60 * 1000  // 5 minutes

// Default map center (India — adjust if targeting a specific city)
export const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629 }
export const DEFAULT_MAP_ZOOM   = 5
export const CITY_MAP_ZOOM      = 13
