/**
 * Application-wide constants.
 * Centralizes magic numbers and configuration values.
 */

// ===== File Size Limits =====
export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;       // 2 MB
export const FILE_READ_MAX_BYTES = 500 * 1024 * 1024;       // 500 MB
export const JSON_BODY_LIMIT = 10 * 1024;                     // 10 KB
export const URLENCODED_BODY_LIMIT = 10 * 1024;               // 10 KB

// ===== Image =====
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'];
export const ICON_GEN_SIZES = [16, 24, 32, 48, 64, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024];

// ===== Video =====
export const VIDEO_MAX_CONCURRENT = 3;
export const VIDEO_CONCURRENCY = 3;

// ===== Audio =====
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'];

// ===== Storage =====
export const RECENT_TOOLS_KEY = 'toolknit_recent_tools';
export const MAX_RECENT_TOOLS = 3;
export const FAVORITES_KEY = 'toolknit_favorites';
export const LANG_STORAGE_KEY = 'toolknit-lang';
export const INSTALLER_LANG_STORAGE_KEY = 'toolknit-installer-lang';
export const TOKEN_STORAGE_KEY = 'toolknit_token';

// ===== Rate Limiting =====
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;               // 1 minute
export const RATE_LIMIT_MAX通用 = 100;
export const RATE_LIMIT_REGISTER_MAX = 5;
export const RATE_LIMIT_REGISTER_WINDOW_MS = 60 * 60 * 1000;  // 1 hour
export const RATE_LIMIT_LOGIN_MAX = 10;
export const RATE_LIMIT_LOGIN_WINDOW_MS = 5 * 60 * 1000;      // 5 minutes

// ===== UI Timing =====
export const FADE_TRANSITION_MS = 300;
export const TOAST_DURATION_MS = 3000;
export const DEBOUNCE_INPUT_MS = 500;

// ===== Upload =====
export const MAX_AVATAR_SIZE_MB = 2;
export const ALLOWED_AVATAR_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
export const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
