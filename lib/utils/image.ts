/**
  * Utilitaire de validation et compression d'images côté client avant envoi vers Supabase Storage.
  */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format d’image non supporté. Veuillez utiliser un fichier JPG, PNG ou WEBP.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'L’image dépasse la taille maximale autorisée (5 Mo).',
    };
  }

  return { valid: true };
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
