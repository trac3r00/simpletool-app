/**
 * CSS Loader - Embeds compiled Tailwind CSS
 * For production deployment with Cloudflare Workers
 */

// This will be replaced during build with the actual CSS content
// The build script will inline the compiled CSS here
export const compiledCSS = `/* Compiled Tailwind CSS will be embedded here during build */`;

export function getStyleTag() {
  return `<style>${compiledCSS}</style>`;
}

export function getStyleLink() {
  // For development, link to external file
  // For production, use inline styles
  if (process.env.NODE_ENV === 'production') {
    return getStyleTag();
  }
  return '<link rel="stylesheet" href="/dist/styles.css">';
}
