/**
 * Constantes y layout unificado para la firma visual.
 * Este módulo define la estructura EXACTA que se renderiza tanto en:
 *   1. SignatureSettingsPage (preview de configuración)
 *   2. CanvasSignature (preview sobre el PDF)
 *   3. Backend signatures.service.js (estampado real en PDF)
 *
 * REGLA: Cualquier cambio visual debe hacerse aquí y reflejarse en los 3 contextos.
 */

// Textos oficiales del sello
export const STAMP_TEXTS = {
  HEADER: '',
  FOOTER_DATE_PREFIX: 'Fecha:',
  FOOTER_HASH_PREFIX: 'VERIFICADO:',
  FOOTER_IDENTITY: 'IDENTIDAD VERIFICADA POR',
};

// Configuración por defecto del sello
export const DEFAULT_SETTINGS = {
  width: 220,
  height: 100,
  fontSizes: {
    name: 10,
    position: 8,
    colegiatura: 8,
    details: 7,
    meta: 6,
  },
  fields: {
    name: true,
    position: true,
    colegiatura: true,
    details: true,
    hash: true,
  },
  color: '#0f172a',
  borderColor: '#3b82f6',
  borderWidth: 2,
  rotation: 0,
  opacity: 0.95,
  accentImagePath: null,
};

// Colores de texto (en formato CSS y equivalente rgb 0-1 para pdf-lib)
export const TEXT_COLORS = {
  header: { css: 'var(--border-color)', pdfRgb: null }, // usa borderColor dinámico
  name: { css: '#0f172a', pdfRgb: [0, 0, 0] },
  position: { css: '#4b5563', pdfRgb: [0.3, 0.3, 0.3] },
  colegiatura: { css: '#6b7280', pdfRgb: [0.4, 0.4, 0.4] },
  details: { css: '#9ca3af', pdfRgb: [0.5, 0.5, 0.5] },
  meta: { css: '#9ca3af', pdfRgb: [0.6, 0.6, 0.6] },
};

// Estructura del layout: espaciado entre campos (en px)
export const LAYOUT = {
  paddingX: 12,           // padding horizontal interno
  paddingTop: 12,         // padding superior
  paddingBottom: 8,       // padding inferior (para footer)
  lineSpacing: 3,         // espacio entre líneas de texto
  footerHeight: 14,       // altura reservada para el footer
  accentBorderMultiplier: 3, // multiplicador del borderWidth para el borde izquierdo
};

/**
 * Factor de conversión CSS pixels → PDF points.
 * CSS: 1px = 1/96". PDF: 1pt = 1/72".
 * El backend multiplica todas las dimensiones por este factor
 * para que el tamaño en el PDF coincida con lo que se ve en pantalla.
 */
export const PX_TO_PT = 72 / 96; // 0.75

/**
 * Fusiona settings del usuario con los defaults.
 * Garantiza que siempre haya valores válidos.
 */
export function mergeSettings(userSettings) {
  if (!userSettings) return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...userSettings,
    fontSizes: { ...DEFAULT_SETTINGS.fontSizes, ...(userSettings.fontSizes || {}) },
    fields: { ...DEFAULT_SETTINGS.fields, ...(userSettings.fields || {}) },
  };
}
