/**
 * templateService.js - Template Service
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
