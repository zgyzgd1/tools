/**
 * DOM and utility helpers shared across modules.
 */

/**
 * Escape HTML entities to prevent XSS when inserting user content via innerHTML.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format bytes into human-readable string (e.g. "1.5 MB").
 * @param {number} bytes
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format seconds into mm:ss or hh:mm:ss.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Create an element with attributes and children.
 * @param {string} tag
 * @param {Object} [attrs]
 * @param {Node[]} [children]
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') el.className = v;
    else if (k === 'textContent') el.textContent = v;
    else if (k === 'innerHTML') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  }
  return el;
}

/**
 * Get a unique output path that doesn't collide with existing files.
 * @param {string} dir
 * @param {string} stem
 * @param {string} ext
 * @returns {string}
 */
export function getUniqueOutputPath(dir, stem, ext) {
  let path = `${dir}/${stem}${ext}`;
  let counter = 1;
  while (fileExists(path)) {
    path = `${dir}/${stem}_${counter}${ext}`;
    counter++;
  }
  return path;
}

// Placeholder — replaced by Tauri's exists_path in desktop, no-op in web
function fileExists(_path) { return false; }
