/**
 * Application configuration.
 * Override at build time via .env or environment variables:
 *   VITE_API_BASE=https://your-api.com npm run build
 *
 * See .env.example for all available variables.
 */

export const AUTH_API_BASE = import.meta.env.VITE_API_BASE || 'https://toolknitapi.24picture.com';

export const UPDATE_MANIFEST_PRIMARY = import.meta.env.VITE_UPDATE_MANIFEST_PRIMARY || 'https://cdn.24picture.com/toolknit/manifest.json';

export const UPDATE_MANIFEST_FALLBACK = import.meta.env.VITE_UPDATE_MANIFEST_FALLBACK || 'https://toolknit.cn-nb1.rains3.com/manifest.json';

export const FFMPEG_PRIMARY_CN = import.meta.env.VITE_FFMPEG_PRIMARY_CN || 'https://toolknit.cn-nb1.rains3.com/ffmpeg-master-latest-win64-gpl.zip';

export const FFMPEG_PRIMARY_EN = import.meta.env.VITE_FFMPEG_PRIMARY_EN || 'https://cdn.24picture.com/ffmpeg-master-latest-win64-gpl.zip';
