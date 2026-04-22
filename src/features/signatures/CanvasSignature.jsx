import { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { STAMP_TEXTS, LAYOUT, PX_TO_PT, mergeSettings } from './signatureLayout';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function CanvasSignature({ documentId, onCoordsChange, onTotalPages, sigData, settings, pageMode, pageRange, refreshKey }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pdfRef = useRef(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [signaturePos, setSignaturePos] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.3);

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3.0;
  const ZOOM_STEP = 0.2;
  const ZOOM_DEFAULT = 1.3;

  const sigSettings = mergeSettings(settings);

  const renderPage = useCallback(async (pdfDocument, num, scale) => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDocument.getPage(num);
      const vp = page.getViewport({ scale });
      setViewport(vp);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      canvas.height = vp.height;
      canvas.width = vp.width;

      const renderTask = page.render({
        canvasContext: context,
        viewport: vp,
      });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    }
  }, []);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/documents/${documentId}`);
        const filename = (data.signedPath || data.originalPath).split(/[\\/]/).pop();
        const pdfUrl = `/uploads/${filename}`;

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdfDocument = await loadingTask.promise;
        pdfRef.current = pdfDocument;
        setTotalPages(pdfDocument.numPages);
        if (onTotalPages) onTotalPages(pdfDocument.numPages);
        await renderPage(pdfDocument, 1, ZOOM_DEFAULT);
      } catch (err) {
        if (err.name === 'RenderingCancelledException') return;
        console.error('Error loading PDF:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (pdfRef.current) {
        pdfRef.current.destroy();
      }
    };
  }, [documentId, renderPage, refreshKey]);

  // Navegar entre páginas
  useEffect(() => {
    if (pdfRef.current && !loading) {
      renderPage(pdfRef.current, pageNumber, zoomLevel);
      setSignaturePos(null);
    }
  }, [pageNumber, renderPage, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-renderizar al cambiar zoom
  useEffect(() => {
    if (pdfRef.current && !loading) {
      renderPage(pdfRef.current, pageNumber, zoomLevel);
      setSignaturePos(null);
    }
  }, [zoomLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPrevPage = () => {
    if (pageNumber > 1) setPageNumber(p => p - 1);
  };

  const goToNextPage = () => {
    if (pageNumber < totalPages) setPageNumber(p => p + 1);
  };

  const handleCanvasClick = (e) => {
    if (!viewport || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculamos el tamaño del sello en píxeles del canvas actual
    const overlayW = pdfWidth * viewport.scale;
    const overlayH = pdfHeight * viewport.scale;

    // Aplicamos Clamping: Aseguramos que la firma no se salga de los bordes del canvas
    // La coordenada Y del clic se ajusta para que el sello quede sobre el punto del clic (como en el preview)
    const clampedX = Math.max(0, Math.min(x, viewport.width - overlayW));
    const clampedY = Math.max(0, Math.min(y, viewport.height - overlayH));

    setSignaturePos({ x: clampedX, y: clampedY + overlayH }); // Guardamos la base para el preview local

    // Escalar las coordenadas al espacio del Documento PDF (puntos)
    const canvasX = clampedX;
    const canvasY = clampedY + overlayH; // Enviamos la esquina inferior izquierda al backend
    
    const [pdfX, pdfY] = viewport.convertToPdfPoint(canvasX, canvasY);

    onCoordsChange({
      x: pdfX,
      y: pdfY,
      width: sigSettings.width,
      height: sigSettings.height,
      page: pageNumber
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold animate-pulse">Cargando motor de renderizado...</p>
    </div>
  );

  const pdfWidth = sigSettings.width * PX_TO_PT;
  const pdfHeight = sigSettings.height * PX_TO_PT;
  const accentWidth = sigSettings.borderWidth * PX_TO_PT * LAYOUT.accentBorderMultiplier;

  // Helper para multilínea
  const wrapText = (text, size, maxWidth) => {
    if (!text) return [];
    const words = text.split(' ').filter(Boolean);
    if (words.length === 0) return [];
    const lines = [];
    let currentLine = words[0];
    const charWidth = size * 0.52; // Aproximación estándar
    for (let i = 1; i < words.length; i++) {
        const width = (currentLine + ' ' + words[i]).length * charWidth;
        if (width < maxWidth) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
  };

  return (
    <div className="flex flex-col">
      {/* Barra de controles: paginación + zoom */}
      <div className="flex items-center justify-between gap-4 py-3 px-4 bg-white border-b border-slate-200">
        {/* Paginación */}
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Pág.</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setPageNumber(val);
                }}
                className="w-12 text-center text-sm font-bold border border-slate-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-slate-400">/ <strong>{totalPages}</strong></span>
            </div>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Controles de zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(1))))}
            disabled={zoomLevel <= ZOOM_MIN}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setZoomLevel(ZOOM_DEFAULT)}
            className="min-w-[52px] text-center text-xs font-black text-slate-700 bg-slate-100 hover:bg-primary-50 hover:text-primary rounded-lg py-1.5 px-2 transition-colors"
            title="Restablecer zoom"
          >
            {Math.round((zoomLevel / ZOOM_DEFAULT) * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(1))))}
            disabled={zoomLevel >= ZOOM_MAX}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setZoomLevel(ZOOM_DEFAULT)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Restablecer zoom"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Canvas del PDF */}
      <div className="flex justify-center p-8 bg-slate-100 overflow-auto max-h-[750px] relative transition-all">
        <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair bg-white"
          />
          {signaturePos && viewport && (() => {
            const overlayW = pdfWidth * viewport.scale;
            const overlayH = pdfHeight * viewport.scale;
            
            // La posición ya viene "clamped" desde handleCanvasClick
            const overlayLeft = signaturePos.x;
            const overlayTop = signaturePos.y - overlayH;
            
            return (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: sigSettings.rotation || 0
              }}
              className="absolute pointer-events-none overflow-hidden"
              style={{
                left: overlayLeft,
                top: overlayTop,
                width: overlayW,
                height: overlayH,
                opacity: sigSettings.opacity,
                transformOrigin: '0% 100%',
              }}
            >
              {/* Fondo transparente */}

              {/* Borde izquierdo accent */}
              {sigSettings.fields.accentBorder !== false && (
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: `${accentWidth * viewport.scale}px`,
                    backgroundColor: sigSettings.borderColor,
                  }}
                />
              )}

              {/* Bordes sutiles (4 lados) */}
              <div
                className="absolute inset-0"
                style={{
                  borderTop: `1px solid ${sigSettings.borderColor}25`,
                  borderRight: `1px solid ${sigSettings.borderColor}25`,
                  borderBottom: `1px solid ${sigSettings.borderColor}25`,
                  borderLeft: `1px solid ${sigSettings.borderColor}25`,
                }}
              />

              {/* Contenido del sello - todas las dimensiones usan PX_TO_PT para coincidir con el PDF */}
              {(() => {
                const hasImg = !!sigSettings.signatureImagePath;
                const imgAreaWidth = pdfWidth * 0.28;
                const textPadLeft = hasImg
                  ? (accentWidth + imgAreaWidth + (8 * PX_TO_PT))
                  : ((sigSettings.fields.accentBorder !== false ? accentWidth : 0) + (LAYOUT.paddingX * PX_TO_PT));

                return (
                  <div
                    className="relative h-full flex flex-col justify-center"
                    style={{
                      paddingLeft: `${textPadLeft * viewport.scale}px`,
                      paddingRight: `${LAYOUT.paddingX * PX_TO_PT * viewport.scale}px`,
                      paddingTop: `${LAYOUT.paddingTop * PX_TO_PT * viewport.scale * 0.8}px`,
                    }}
                  >
                {/* Imagen del sello si existe */}
                {sigSettings.signatureImagePath && (
                  <img
                    src={`/uploads/signatures/${sigSettings.signatureImagePath.split(/[\\/]/).pop()}`}
                    alt="Sello"
                    className="absolute object-contain"
                    style={{
                      left: `${accentWidth * viewport.scale + 4}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: `${pdfWidth * viewport.scale * 0.28}px`,
                      height: `${pdfHeight * viewport.scale * 0.70}px`,
                      opacity: 0.9,
                    }}
                  />
                )}

                {/* Name (multilínea) */}
                {sigSettings.fields.name && (
                  wrapText(sigData?.name || '', sigSettings.fontSizes.name * PX_TO_PT, pdfWidth - textPadLeft - (LAYOUT.paddingX * PX_TO_PT)).map((line, idx) => (
                    <p
                      key={`name-${idx}`}
                      className="font-black text-slate-900 leading-tight uppercase"
                      style={{
                        fontSize: `${sigSettings.fontSizes.name * PX_TO_PT * viewport.scale}px`,
                        marginBottom: `${LAYOUT.lineSpacing * PX_TO_PT * viewport.scale * 0.5}px`,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {line}
                    </p>
                  ))
                )}

                {/* Position (Soporte multilínea) */}
                {sigSettings.fields.position && sigData?.position && (
                  wrapText(sigData.position, sigSettings.fontSizes.position * PX_TO_PT, pdfWidth - textPadLeft - (LAYOUT.paddingX * PX_TO_PT)).map((line, idx) => (
                    <p
                      key={`pos-${idx}`}
                      className="font-bold leading-tight"
                      style={{
                        fontSize: `${sigSettings.fontSizes.position * PX_TO_PT * viewport.scale}px`,
                        color: '#4b5563',
                        marginBottom: `${LAYOUT.lineSpacing * PX_TO_PT * viewport.scale * 0.5}px`,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {line}
                    </p>
                  ))
                )}

                {/* Colegiatura */}
                {sigSettings.fields.colegiatura && (
                  <p
                    className="font-semibold leading-tight truncate"
                    style={{
                      fontSize: `${sigSettings.fontSizes.colegiatura * PX_TO_PT * viewport.scale}px`,
                      color: '#6b7280',
                      marginBottom: `${LAYOUT.lineSpacing * PX_TO_PT * viewport.scale * 0.5}px`,
                    }}
                  >
                    {sigData?.colegiatura}
                  </p>
                )}

                {/* Details */}
                {sigSettings.fields.details && (
                  <p
                    className="font-medium leading-tight truncate"
                    style={{
                      fontSize: `${sigSettings.fontSizes.details * PX_TO_PT * viewport.scale}px`,
                      color: '#9ca3af',
                    }}
                  >
                    {sigData?.details}
                  </p>
                )}

                {/* Footer - 2 líneas apiladas */}
                <div
                  className="flex flex-col"
                  style={{
                    marginTop: 'auto',
                    paddingTop: `${2 * PX_TO_PT * viewport.scale}px`,
                    gap: `${1 * PX_TO_PT * viewport.scale}px`,
                  }}
                >
                  <span
                    className="font-bold uppercase truncate"
                    style={{
                      fontSize: `${sigSettings.fontSizes.meta * PX_TO_PT * viewport.scale}px`,
                      color: '#9ca3af',
                    }}
                  >
                    {STAMP_TEXTS.FOOTER_DATE_PREFIX} {new Date().toLocaleDateString()}
                  </span>
                  {sigSettings.fields.hash && (
                    <span
                      className="font-bold truncate"
                      style={{
                        fontSize: `${(sigSettings.fontSizes.meta - 1) * PX_TO_PT * viewport.scale}px`,
                        color: '#9ca3af',
                      }}
                    >
                      {STAMP_TEXTS.FOOTER_HASH_PREFIX} XXXXXX
                    </span>
                  )}
                  </div>
                </div>
              );
            })()}
            </motion.div>
            );
          })()}
        </div>
      </div>

      {/* Info de páginas a firmar */}
      {totalPages > 1 && signaturePos && (
        <div className="text-center py-2 bg-primary-50 border-t border-primary-100">
          <p className="text-xs font-bold text-primary">
            {pageMode === 'current'
              ? `La firma se aplicará solo en la página ${pageNumber}`
              : pageMode === 'range' && pageRange
                ? `La firma se aplicará en las páginas: ${pageRange}`
                : `La firma se aplicará en todas las ${totalPages} páginas`
            }
          </p>
        </div>
      )}
    </div>
  );
}
