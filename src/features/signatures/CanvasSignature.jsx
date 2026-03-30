import { useRef, useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import api from '../../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { STAMP_TEXTS, LAYOUT, PX_TO_PT, mergeSettings } from './signatureLayout';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function CanvasSignature({ documentId, onCoordsChange, onTotalPages, sigData, settings, pageMode, pageRange }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pdfRef = useRef(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [signaturePos, setSignaturePos] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [loading, setLoading] = useState(true);

  const sigSettings = mergeSettings(settings);

  const renderPage = useCallback(async (pdfDocument, num) => {
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDocument.getPage(num);
      const scale = 1.3;
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
        await renderPage(pdfDocument, 1);
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
  }, [documentId, renderPage]);

  // Navegar entre páginas
  useEffect(() => {
    if (pdfRef.current && !loading) {
      renderPage(pdfRef.current, pageNumber);
      // Limpiar posición de firma al cambiar de página
      setSignaturePos(null);
    }
  }, [pageNumber, renderPage, loading]);

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

    setSignaturePos({ x, y });

    // Escalar las coordenadas del clic (en píxeles de pantalla) al espacio del viewport de pdf.js
    const canvasX = x * (viewport.width / rect.width);
    const canvasY = y * (viewport.height / rect.height);
    const [pdfX, pdfY] = viewport.convertToPdfPoint(canvasX, canvasY);
    // Las coordenadas x,y ya están en PDF points (divididas por viewport.scale).
    // width/height se envían en CSS pixels; el backend las convierte con PX_TO_PT.
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

  // Tamaño real en PDF points (lo que el backend dibuja)
  const pdfWidth = sigSettings.width * PX_TO_PT;
  const pdfHeight = sigSettings.height * PX_TO_PT;
  const accentWidth = sigSettings.borderWidth * PX_TO_PT * LAYOUT.accentBorderMultiplier;

  return (
    <div className="flex flex-col">
      {/* Barra de navegación de páginas */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 px-4 bg-white border-b border-slate-200">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">Página</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) setPageNumber(val);
              }}
              className="w-14 text-center text-sm font-bold border border-slate-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-slate-500">de <strong>{totalPages}</strong></span>
          </div>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= totalPages}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      )}

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
            // Clamping: replicar el backend para que el preview coincida con el PDF
            const clampedLeft = Math.max(0, Math.min(signaturePos.x, viewport.width - overlayW));
            const clampedTop = Math.max(0, Math.min(signaturePos.y - overlayH, viewport.height - overlayH));
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
                left: clampedLeft,
                top: clampedTop,
                width: overlayW,
                height: overlayH,
                opacity: sigSettings.opacity,
                transformOrigin: '0% 100%',
              }}
            >
              {/* Fondo transparente */}

              {/* Borde izquierdo accent */}
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: `${accentWidth * viewport.scale}px`,
                  backgroundColor: sigSettings.borderColor,
                }}
              />

              {/* Bordes sutiles (top, right, bottom) */}
              <div
                className="absolute inset-0"
                style={{
                  borderTop: `1px solid ${sigSettings.borderColor}25`,
                  borderRight: `1px solid ${sigSettings.borderColor}25`,
                  borderBottom: `1px solid ${sigSettings.borderColor}25`,
                }}
              />

              {/* Contenido del sello - todas las dimensiones usan PX_TO_PT para coincidir con el PDF */}
              {(() => {
                const hasImg = !!sigSettings.signatureImagePath;
                const imgAreaWidth = pdfWidth * 0.35;
                const textPadLeft = hasImg 
                  ? (accentWidth + imgAreaWidth + (8 * PX_TO_PT)) 
                  : (accentWidth + (LAYOUT.paddingX * PX_TO_PT));

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
                      width: `${pdfWidth * viewport.scale * 0.30}px`,
                      height: `${pdfHeight * viewport.scale * 0.70}px`,
                      opacity: 0.9,
                    }}
                  />
                )}

                {/* Name */}
                {sigSettings.fields.name && (
                  <p
                    className="font-black text-slate-900 leading-tight uppercase truncate"
                    style={{
                      fontSize: `${sigSettings.fontSizes.name * PX_TO_PT * viewport.scale}px`,
                      marginBottom: `${LAYOUT.lineSpacing * PX_TO_PT * viewport.scale * 0.5}px`,
                    }}
                  >
                    {sigData?.name}
                  </p>
                )}

                {/* Position */}
                {sigSettings.fields.position && (
                  <p
                    className="font-bold leading-tight truncate"
                    style={{
                      fontSize: `${sigSettings.fontSizes.position * PX_TO_PT * viewport.scale}px`,
                      color: '#4b5563',
                      marginBottom: `${LAYOUT.lineSpacing * PX_TO_PT * viewport.scale * 0.5}px`,
                    }}
                  >
                    {sigData?.position}
                  </p>
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
                    borderTop: '1px solid rgba(0,0,0,0.06)',
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
