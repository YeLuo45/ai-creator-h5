/**
 * templateService.js - Template Service
 * Supports encrypted templates with lock icon display
 */

import { getTemplatesByType, getTemplateById } from '../data/templates.js';

export function loadTemplates(type) {
  return getTemplatesByType(type);
}

export function getTemplate(type, id) {
  return getTemplateById(type, id);
}

/**
 * Apply template to form
 * Fills prompt and sets form params
 */
export function applyTemplate(type, templateId) {
  const template = getTemplateById(type, templateId);
  if (!template) return null;

  return {
    prompt: template.prompt,
    params: template.params
  };
}

/**
 * Check if template requires encryption
 */
export function isTemplateEncrypted(type, templateId) {
  const template = getTemplateById(type, templateId);
  return template ? !!template.encrypted : false;
}

/**
 * Mark template as encrypted (for sensitive templates)
 */
export function markTemplateEncrypted(type, templateId, encrypted = true) {
  const templates = getTemplatesByType(type);
  const template = templates.find(t => t.id === templateId);
  if (template) {
    template.encrypted = encrypted;
  }
}

/**
 * Get templates with encryption status
 */
export function getTemplatesWithEncryptionStatus(type) {
  const templates = getTemplatesByType(type);
  return templates.map(t => ({
    ...t,
    isEncrypted: !!t.encrypted
  }));
}

/**
 * Encrypt template data before storage
 */
export async function encryptTemplateData(type, templateId, data) {
  if (!window.CryptoService || window.CryptoService.isLocked()) {
    return { success: false, error: 'Crypto service not available or locked' };
  }
  
  const key = `template_${type}_${templateId}`;
  return await window.CryptoService.encryptAndStore(key, data);
}

/**
 * Decrypt template data from storage
 */
export async function decryptTemplateData(type, templateId) {
  if (!window.CryptoService || window.CryptoService.isLocked()) {
    return { success: false, error: 'Crypto service not available or locked' };
  }
  
  const key = `template_${type}_${templateId}`;
  return await window.CryptoService.retrieveAndDecrypt(key);
}
