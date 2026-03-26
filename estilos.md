# Guía de Estilos Institucionales - Plataforma Chrono-BID

Este documento define la identidad visual y los estándares de diseño de la plataforma. Su objetivo es servir como referencia para mantener la consistencia estética en nuevos módulos y proyectos relacionados.

---

## 1. Paleta de Colores

La paleta se basa en un azul institucional profundo combinado con un naranja de acento para acciones críticas y estados.

### 1.1 Colores Base
| Token | Valor (HEX/HSL) | Uso |
|---|---|---|
| **Primary** | `#23376E` (hsl 224 52% 28%) | Color principal, headers y botones primarios. |
| **Accent** | `#F8AF3C` (hsl 36 94% 61%) | Naranja de acento, alertas y estados de atención. |
| **Background** | `hsl 210 20% 98%` | Fondo general de la aplicación. |
| **Foreground** | `hsl 224 52% 25%` | Texto principal. |
| **Secondary** | `hsl 220 40% 96%` | Fondos de secciones y elementos secundarios. |
| **Destructive** | `#DC2626` | Errores y acciones de eliminación. |

### 1.2 Colores de Estado (Procesos)
| Estado | Color | Uso |
|---|---|---|
| **Borrador** | `#F8AF3C` | Procesos en edición. |
| **Convocado** | `#53A2DA` | Procesos publicados. |
| **Consultas** | `hsl 280 70% 55%` | Etapa de preguntas y respuestas. |
| **Evaluación** | `#F8AF3C` | Etapa de calificación del comité. |
| **Buena Pro** | `#45A043` | Adjudicación de proceso. |
| **Cerrado** | `hsl 220 15% 50%` | Proceso finalizado. |

---

## 2. Tipografía

El sistema utiliza fuentes modernas y legibles optimizadas para interfaces de datos.

- **Fuente Principal**: `Inter` (Sans-serif) - Para toda la interfaz, botones y textos.
- **Fuente Técnica**: `JetBrains Mono` (Monospace) - Para códigos de proceso, hashes de archivos y datos técnicos.

### Escala de Títulos
- **H1**: `text-3xl md:text-5xl font-semibold tracking-tight`
- **H2**: `text-2xl md:text-3xl font-semibold`
- **H3**: `text-xl md:text-2xl font-semibold`

---

## 3. Formas y Bordes

- **Radio de Borde**: `0.625rem` (10px) - Aplicado a cards, inputs y botones para un aspecto moderno y suave.
- **Bordes**: Utilizar el token `--border` (hsl 220 20% 88%) para una separación sutil.

---

## 4. Sombras y Gradientes

### Sombras Institucionales
Las sombras utilizan el azul primario con baja opacidad para mayor profundidad:
- **Shadow MD**: `0 4px 6px -1px rgb(35 55 110 / 0.1)`
- **Shadow Card**: Sombra suave para elevación de tarjetas.

### Gradientes
- **Header**: `linear-gradient(135deg, #23376E 0%, #2A428A 100%)`
- **Hero**: `linear-gradient(180deg, #F7F8FA 0%, #F0F1F4 100%)`
- **Card**: `linear-gradient(145deg, #FFFFFF 0%, #F9FAFB 100%)`

---

## 5. Componentes Custom

### 5.1 Botones (Buttons)
Basados en la variante estándar de estilos utilitarios (Tailwind/shadcn):
- **Botón Primario**: Fondo `--primary` (`#23376E`), texto blanco, esquinas redondeadas (`radius: 0.625rem`). Hover con ligera opacidad o sombra.
- **Botón Secundario/Outline**: Fondo transparente, borde `--border`, texto `--foreground`. Hover con fondo `--secondary`.
- **Botón Destructivo**: Fondo `--destructive` (`#DC2626`), para acciones irreversibles.
- **Tamaños Comunes**:
  - `default`: Altura 40px, padding horizontal 16px.
  - `sm`: Altura 36px, padding horizontal 12px (para tablas o espacios reducidos).
  - `lg`: Altura 44px, padding horizontal 32px (para CTAs principales).

### 5.2 Entradas de Texto (Inputs) y Formularios
- **Bordes**: Utilizan el color `--input` (`hsl 220 20% 88%`).
- **Estados de Foco (Focus)**: Al hacer foco, el borde o el anillo (ring) deben iluminarse con el color `--ring` (`#23376E` o el azul primario).
- **Fondo**: Blanco por defecto, con texto `--foreground`.
- **Labels (Etiquetas)**: Fuente `Inter`, tamaño `sm` (14px), peso `medium` (500).

### 5.3 Iconografía
El sistema utiliza la librería **Lucide Icons** (estándar de la industria en React/shadcn).
- **Estilo**: Líneas limpias (stroke de 2px), terminaciones redondeadas (round).
- **Tamaño por defecto**: 16px (`w-4 h-4` en Tailwind) o 20px (`w-5 h-5`) para iconos independientes.
- **Ejemplos de Iconos Semánticos**:
  - Procesos/Documentos: `FileText`, `Folder`
  - Usuarios/Roles: `Users`, `UserCircle`
  - Fechas/Cronogramas: `Calendar`, `Clock`
  - Estados/Éxito: `CheckCircle2`, `AlertTriangle`
  - Acciones: `Plus`, `Edit`, `Trash2`, `Eye`, `Download`

### 5.4 Card Institucional (`.card-institucional`)
- Fondo degradado suave.
- Borde definido.
- Sombra de elevación.
- Efecto hover: aumento sutil de sombra.

### 5.2 Tabla Institucional (`.tabla-institucional`)
- Cabecera con fondo `Primary` y texto blanco.
- Filas con efecto hover `bg-muted/50`.
- Bordes redondeados en el contenedor.

### 5.3 Timeline de Cronograma (`.timeline-etapa`)
- Línea conectora de 2px.
- Indicadores circulares (nodos):
    - **Verde**: Completado.
    - **Azul con pulso**: Etapa actual.
    - **Gris**: Pendiente.

---

## 6. Modo Oscuro (Dark Mode)

La plataforma adapta automáticamente sus colores para visualización nocturna:
- **Background**: `hsl 224 15% 7%` (Gris casi negro).
- **Surface/Card**: `hsl 224 15% 10%`.
- **Primary**: Ajustado a `hsl 224 45% 45%` para mejor contraste.
- **Accent**: Mantiene el naranja pero con mayor brillo (`hsl 36 90% 65%`).

---

## 7. Filosofía de Diseño

1. **Jerarquía Visual**: Uso de pesos de fuente y colores contrastantes para guiar al usuario.
2. **Transparencia**: Indicadores visuales claros (verde) para estados de cumplimiento.
3. **Formalidad**: El diseño debe sentirse institucional, limpio y profesional, evitando elementos excesivamente decorativos que distraigan del proceso administrativo.
