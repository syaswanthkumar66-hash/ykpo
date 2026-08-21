import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, Maximize, Minimize, ArrowLeft, Minus, Plus, ChevronUp, ChevronDown, Share2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title?: string;
  fileSizeBytes?: number;
  onClose?: () => void;
}

const pdfOptions = { 
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

const PageWrapper = React.memo(({ pageNum, scale, width }: { pageNum: number, scale: number, width: number }) => {
  // Estimate A4 aspect ratio height to prevent layout shifts before PDF chunk finishes painting
  const estimatedHeight = width * scale * 1.414;
  const estimatedWidth = width * scale;

  return (
    <div id={`pdf-page-${pageNum}`} className="flex justify-center relative my-2 sm:my-3 min-h-[50vh]">
        <Page
           pageNumber={pageNum}
           scale={scale}
           width={width}
           className="shadow-[0px_4px_16px_rgba(0,0,0,0.5)] bg-white"
           renderAnnotationLayer={false}
           renderTextLayer={false}
           devicePixelRatio={Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5))}
           loading={
             <div className="flex bg-[#1e2021] text-gray-500 items-center justify-center animate-pulse border border-white/5 shadow-xl" style={{ width: estimatedWidth, height: estimatedHeight }}>
                <div className="flex flex-col items-center gap-3">
                   <Loader2 className="w-6 h-6 animate-spin opacity-50" />
                   <span className="text-xs font-mono">Loading Page {pageNum}</span>
                </div>
             </div>
           }
        />
    </div>
  );
});

export function PdfViewer({ url, title = 'Document.pdf', fileSizeBytes, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [inputPage, setInputPage] = useState<string>('1');
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keep input synchronized with actual active page
  useEffect(() => {
    if (document.activeElement !== document.getElementById('pdf-page-input')) {
      setInputPage(pageNumber.toString());
    }
  }, [pageNumber]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
         // Dynamically calculate width minus generous padding to emulate web-based PDF viewers
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  async function handleShare() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'PDF Document',
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 4));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  function scrollToPage(p: number) {
    if (p < 1 || (numPages && p > numPages)) return;
    setPageNumber(p);
    setInputPage(p.toString());
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function handlePageInputSubmit() {
    let p = parseInt(inputPage);
    if (!isNaN(p)) {
      if (p < 1) p = 1;
      if (numPages && p > numPages) p = numPages;
      scrollToPage(p);
      setInputPage(p.toString());
    } else {
      setInputPage(pageNumber.toString());
    }
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
      (e.target as HTMLInputElement).blur();
    }
  };

  const pages = Array.from(new Array(numPages || 0), (_, index) => index + 1);

  // CRITICAL FIX: Memoize the file prop to prevent react-pdf from redownloading the entire PDF on every state change (zoom, page change).
  const pdfFileOptions = React.useMemo(() => ({
    url,
    length: fileSizeBytes,
    disableAutoFetch: true,
    disableStream: false,
    rangeChunkSize: 65536 // 64KB chunk size
  }), [url, fileSizeBytes]);

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full bg-[#525659] overflow-hidden relative font-sans text-white">
      {/* Top Toolbar */}
      <div className="bg-[#323639] h-[52px] sm:h-14 flex-shrink-0 flex items-center justify-between px-1.5 sm:px-4 shadow-md z-20 w-full select-none">
        {/* Left: Close & Title */}
        <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0 min-w-[30px] max-w-[20%] sm:max-w-[30%]">
          {onClose && (
            <button onClick={onClose} className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
          )}
          <span className="hidden md:block font-medium text-sm sm:text-base text-gray-200 truncate pr-2 w-full" title={title}>
            {title}
          </span>
        </div>

        {/* Center: Pagination & Zoom */}
        {numPages && (
          <div className="flex-1 flex items-center justify-center min-w-max gap-1 sm:gap-3 shrink-0 mx-1">
            {/* Page navigation */}
            <div className="flex items-center bg-[#1e2021] rounded-md px-1.5 sm:px-2 py-1 border border-black/50 shadow-inner">
              <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline mr-1">Page</span>
              <input 
                 id="pdf-page-input"
                 type="text" 
                 value={inputPage}
                 onChange={(e) => setInputPage(e.target.value)}
                 onBlur={() => handlePageInputSubmit()}
                 onKeyDown={handlePageInputKeyDown}
                 className="bg-transparent text-white text-center text-xs sm:text-sm font-mono w-6 sm:w-10 outline-none hover:bg-white/10 rounded transition-colors"
              />
              <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap pl-0.5 border-r border-[#323639] pr-1.5 sm:pr-2 mr-1">/ {numPages}</span>
              <div className="flex gap-1">
                 <button onClick={() => scrollToPage(pageNumber - 1)} disabled={pageNumber <= 1} className="text-gray-300 hover:text-white bg-[#323639] hover:bg-white/20 p-0.5 sm:p-1 rounded shadow-sm disabled:opacity-30 transition-colors cursor-pointer"><ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                 <button onClick={() => scrollToPage(pageNumber + 1)} disabled={pageNumber >= numPages} className="text-gray-300 hover:text-white bg-[#323639] hover:bg-white/20 p-0.5 sm:p-1 rounded shadow-sm disabled:opacity-30 transition-colors cursor-pointer"><ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
              </div>
            </div>

            {/* Zoom block */}
            <div className="flex items-center bg-[#1e2021] rounded-md px-1 sm:px-2 py-1 border border-black/50 shadow-inner pointer-events-auto z-50">
              <button onClick={zoomOut} className="p-0.5 sm:p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"><Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
              <span className="text-[11px] sm:text-sm font-mono text-gray-300 w-9 sm:w-12 text-center select-none block">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={zoomIn} className="p-0.5 sm:p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0 min-w-[30px] justify-end">
           <button onClick={handleShare} className="p-2 sm:p-2.5 rounded-full text-gray-300 hover:bg-white/10 flex items-center justify-center transition-colors" title="Share current link">
             <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
           </button>
           <button onClick={toggleFullscreen} className="p-2 sm:p-2.5 rounded-full text-gray-300 hover:bg-white/10 flex items-center justify-center transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
             {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
           </button>
        </div>
      </div>

      {/* Main Document Body - Native Scrolling */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto overflow-x-auto bg-[#525659] relative custom-scrollbar select-text pb-20"
      >
        <div className="flex flex-col items-center min-h-max" style={{ width: scale > 1 ? 'max-content' : '100%', minWidth: '100%' }}>
          <Document
            file={pdfFileOptions}
            options={pdfOptions}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center text-gray-300 space-y-4 shadow-2xl bg-[#323639] p-8 rounded-lg mt-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <p className="text-sm font-medium tracking-wide">Processing Document Map...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center text-red-400 space-y-4 shadow-xl bg-[#323639] p-8 rounded-lg mt-10">
                <div className="p-4 bg-red-400/10 rounded-full">
                  <Loader2 className="w-8 h-8 opacity-50" /> 
                </div>
                <p className="font-medium text-center px-4 max-w-sm">Failed to load PDF Chunk. Please check connection.</p>
              </div>
            }
            className="flex flex-col items-center w-full relative"
          >
            <PageWrapper 
              key={pageNumber} 
              pageNum={pageNumber} 
              scale={scale} 
              width={containerWidth ? (containerWidth < 640 ? containerWidth - 8 : Math.min(containerWidth - 48, 1200)) : 800} 
            />
          </Document>
        </div>
      </div>
      
      {/* Floating Bottom-Right Page Indicator */}
      {numPages && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs sm:text-sm font-mono text-gray-200 pointer-events-none z-50 border border-white/10 shadow-lg tracking-wide">
          {pageNumber} / {numPages}
        </div>
      )}
    </div>
  );
}
