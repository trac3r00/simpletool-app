
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleMarkdownEditorRoutes } from './markdown-editor.js';

describe('handleMarkdownEditorRoutes', () => {
  it('should return 404 for unknown paths', async () => {
    const url = new URL('http://localhost/markdown-editor/unknown');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    expect(response.status).toBe(404);
  });

  it('should return 200 for GET /markdown-editor', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    expect(response.status).toBe(200);
  });

  it('should return HTML with split pane structure', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    // Verify HTML structure
    expect(text).toContain('<!DOCTYPE html>');
    
    // Verify split pane IDs
    expect(text).toContain('id="md-preview-root"');
    expect(text).toContain('id="md-split"');
    expect(text).toContain('id="md-divider"');
    expect(text).toContain('id="md-editor-pane"');
    expect(text).toContain('id="md-preview-pane"');
  });

  it('should contain responsive split behavior CSS', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    expect(text).toContain('grid-template-rows');
    expect(text).toContain('grid-template-columns');
    expect(text).toContain('--split');
  });

  it('should contain markdown input textarea', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    expect(text).toContain('id="markdown-input"');
    expect(text).toContain('textarea');
  });

  it('should contain preview output container', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    expect(text).toContain('id="preview-output"');
  });

  it('should contain view mode buttons', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    expect(text).toContain('data-view-mode="split"');
    expect(text).toContain('data-view-mode="edit"');
    expect(text).toContain('data-view-mode="preview"');
  });

  it('should contain export and utility buttons', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    expect(text).toContain('id="open-md-btn"');
    expect(text).toContain('id="clear-md-btn"');
    expect(text).toContain('id="copy-md-btn"');
    expect(text).toContain('id="copy-html-btn"');
    expect(text).toContain('id="download-md-btn"');
    expect(text).toContain('id="download-html-btn"');
    expect(text).toContain('id="print-btn"');
  });

  it('should include vendor scripts for markdown processing', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();
    
    expect(text).toContain('/vendor/marked.min.js');
    expect(text).toContain('/vendor/purify.min.js');
    expect(text).toContain('/vendor/mermaid.min.js');
  });

  it('should preserve client-side regex escapes in the rendered script', async () => {
    const url = new URL('http://localhost/markdown-editor');
    const request = new Request(url, { method: 'GET' });

    const response = await handleMarkdownEditorRoutes(request, url);
    const text = await response.text();

    expect(text).toContain('.replace(/[^a-z0-9\\s-]/g, \'\')');
    expect(text).toContain('.replace(/\\s+/g, \'-\')');
  });

  it('should return 404 for trailing slash with unknown path', async () => {
    const url = new URL('http://localhost/markdown-editor/api');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    expect(response.status).toBe(404);
  });

  it('should handle trailing slash on main route', async () => {
    const url = new URL('http://localhost/markdown-editor/');
    const request = new Request(url, { method: 'GET' });
    
    const response = await handleMarkdownEditorRoutes(request, url);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('id="md-preview-root"');
  });
});
