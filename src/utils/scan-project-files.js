const EXCLUDED_SEGMENTS = [
  'node_modules',
  'dist',
  '.git',
  '.wrangler',
  'coverage',
  'vendor',
];

export function isProjectOwnedFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return !EXCLUDED_SEGMENTS.some(segment => parts.includes(segment));
}
