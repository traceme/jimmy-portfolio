import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Box, IconButton, ButtonGroup, Button, Typography, GlobalStyles, CircularProgress, TextField } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Brightness4, 
  Brightness7,
  Fullscreen,
  FullscreenExit,
  ArrowBack,
  ZoomOut,
  ZoomIn,
  RotateRight,
  ViewColumn,
  ViewStream
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const backgroundOptions = [
  { label: 'Darkest', color: '#1a1a1a', textBrightness: 65 },
  { label: 'Dark', color: '#2a2a2a', textBrightness: 80 },
  { label: 'Medium', color: '#4a4a4a', textBrightness: 95 },
  { label: 'Light', color: '#f0f0f0', textBrightness: 110 },
  { label: 'Lightest', color: '#ffffff', textBrightness: 135 },
];

const nightModeColors = {
  background: '#1a1a1a',
  overlay: 'rgba(0, 0, 0, 0.5)',
  text: '#ffffff'
};

const buttonStyles = {
  navigation: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
    '&.Mui-disabled': {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    transition: 'all 0.3s ease',
  },
  control: {
    minWidth: 'unset',
    borderRadius: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    transition: 'all 0.2s ease',
  },
};

interface PDFViewerProps {
  pdfPath: string;
  title: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfPath, title }) => {
  const navigate = useNavigate();
  const bookId = pdfPath.split('/').pop()?.split('.')[0] || '';

  const loadSavedPreferences = () => {
    const savedPrefs = localStorage.getItem(`pdfPrefs_${bookId}`);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      return {
        pageNumber: prefs.pageNumber || 1,
        scale: prefs.scale || 1.0,
        rotation: prefs.rotation || 0,
        isFullscreen: false,
        isNightMode: prefs.isNightMode || false,
        backgroundColor: prefs.backgroundColor || backgroundOptions[4].color,
        isSinglePage: prefs.isSinglePage || false,
      };
    }
    return {
      pageNumber: 1,
      scale: 1.0,
      rotation: 0,
      isFullscreen: false,
      isNightMode: false,
      backgroundColor: backgroundOptions[4].color,
      isSinglePage: false,
    };
  };

  const savedPrefs = loadSavedPreferences();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(savedPrefs.pageNumber);
  const [scale, setScale] = useState<number>(savedPrefs.scale || 1.5);
  const [rotation, setRotation] = useState<number>(savedPrefs.rotation);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(savedPrefs.isFullscreen);
  const [isNightMode, setIsNightMode] = useState<boolean>(savedPrefs.isNightMode);
  const [backgroundColor, setBackgroundColor] = useState<string>(savedPrefs.backgroundColor);
  const [isSinglePage, setIsSinglePage] = useState<boolean>(savedPrefs.isSinglePage);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isWorkerLoaded, setIsWorkerLoaded] = useState(false);
  const [jumpToPage, setJumpToPage] = useState<string>('');

  useEffect(() => {
    const prefsToSave = {
      pageNumber,
      scale,
      rotation,
      isNightMode,
      backgroundColor,
      isSinglePage,
    };
    localStorage.setItem(`pdfPrefs_${bookId}`, JSON.stringify(prefsToSave));
  }, [bookId, pageNumber, scale, rotation, isNightMode, backgroundColor, isSinglePage]);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  const loadingTask = useMemo(() => {
    if (!currentPdfUrl) return null;
    
    return pdfjs.getDocument({
      url: currentPdfUrl,
      rangeChunkSize: 65536, // 64KB chunks
      maxImageSize: 16777216, // 16MB
      cMapUrl: 'https://unpkg.com/pdfjs-dist@2.12.313/cmaps/',
      cMapPacked: true,
    });
  }, [currentPdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError(error.message);
    setLoading(false);
  };

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfUrl = `http://localhost:3001${pdfPath}`;
        console.log('Loading PDF from:', pdfUrl);
        
        const response = await fetch(pdfUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        setCurrentPdfUrl(pdfUrl);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfPath]);

  useEffect(() => {
    if (currentPdfUrl) {
      setPageNumber(1);
    }
  }, [currentPdfUrl]);

  useEffect(() => {
    if (loadingTask) {
      loadingTask.promise
        .then((pdf) => {
          setNumPages(pdf.numPages);
          setIsWorkerLoaded(true);
          setError(null);
        })
        .catch((error) => {
          console.error('Error loading PDF:', error);
          setError('Failed to load PDF. Please try again.');
          setIsWorkerLoaded(true);
        });
    }
  }, [loadingTask]);

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - (isSinglePage ? 1 : 2));
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + (isSinglePage ? 1 : 2));
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      goToPrevPage();
    } else if (event.key === 'ArrowRight') {
      goToNextPage();
    } else if (event.key === 'f') {
      setIsFullscreen(!isFullscreen);
    }
  }, [pageNumber, numPages]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
      
      // Reset worker state before changing scale
      setIsWorkerLoaded(false);
      
      // Wait a bit for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update scale and reinitialize worker
      if (isFullscreenNow) {
        setScale(1.4);
      } else {
        setScale(1.0);
      }
      
      // Reinitialize worker if we have a PDF URL
      if (currentPdfUrl) {
        try {
          const loadingTask = pdfjs.getDocument(currentPdfUrl);
          await loadingTask.promise;
          setIsWorkerLoaded(true);
        } catch (error) {
          console.error('Error reinitializing PDF worker:', error);
          setError('Failed to reinitialize PDF viewer');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [currentPdfUrl]);

  useEffect(() => {
    if (scale > 0) {
      setIsWorkerLoaded(false);
      const initWorker = async () => {
        if (currentPdfUrl) {
          try {
            const loadingTask = pdfjs.getDocument(currentPdfUrl);
            await loadingTask.promise;
            setIsWorkerLoaded(true);
          } catch (error) {
            console.error('Error initializing worker after scale change:', error);
            setError('Failed to update PDF view');
          }
        }
      };
      initWorker();
    }
  }, [scale, currentPdfUrl]);

  const handleJumpToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(jumpToPage);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
        const newPage = isSinglePage ? pageNum : (pageNum % 2 === 0 ? pageNum - 1 : pageNum);
        setPageNumber(newPage);
        setJumpToPage('');
      }
    }
  };

  return (
    <>
      <GlobalStyles
        styles={{
          '.night-mode-page': {
            backgroundColor: '#1a1a1a !important',
            '& canvas': {
              filter: 'invert(92%) brightness(65%) contrast(130%) sepia(10%) !important',
              mixBlendMode: 'screen !important',
              backgroundColor: '#1a1a1a !important',
              opacity: '0.95 !important'
            }
          },
          '.react-pdf__Page': {
            transition: 'all 0.5s ease !important',
            backgroundColor: 'transparent !important',
          }
        }}
      />

      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: isNightMode ? nightModeColors.background : backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.5s ease',
      }}>
        {/* Night mode overlay */}
        {isNightMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: nightModeColors.overlay,
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        {/* Top Controls */}
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          color: isNightMode ? nightModeColors.text : 'text.primary'
        }}>
          <ButtonGroup variant="contained" size="small" sx={{ gap: 1 }}>
            <Button 
              onClick={() => navigate('/library')}
              sx={buttonStyles.control}
            >
              <ArrowBack />
            </Button>
            <Button 
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
              sx={buttonStyles.control}
            >
              <ZoomOut />
            </Button>
            <Button 
              onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
              sx={buttonStyles.control}
            >
              <ZoomIn />
            </Button>
            <Button 
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              sx={buttonStyles.control}
            >
              <RotateRight />
            </Button>
            <Button
              onClick={() => setIsSinglePage(prev => !prev)}
              sx={buttonStyles.control}
            >
              {isSinglePage ? <ViewColumn /> : <ViewStream />}
            </Button>
          </ButtonGroup>

          <ButtonGroup variant="contained" size="small" sx={{ gap: 1 }}>
            <Button 
              onClick={() => setIsNightMode(prev => !prev)}
              sx={buttonStyles.control}
            >
              {isNightMode ? <Brightness7 /> : <Brightness4 />}
            </Button>
            <Button 
              onClick={toggleFullscreen}
              sx={buttonStyles.control}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </Button>
          </ButtonGroup>
        </Box>

        {/* Background Color Options */}
        <Box sx={{ 
          position: 'fixed',
          bottom: 20,
          left: 20,
          display: 'flex',
          flexDirection: 'row',
          gap: 0.5,
          bgcolor: 'background.paper',
          p: 0.5,
          borderRadius: 1,
          boxShadow: 3,
          zIndex: 1000,
          transform: 'scale(0.6)',
          transformOrigin: 'bottom left'
        }}>
          {backgroundOptions.map((option) => (
            <Button
              key={option.label}
              onClick={() => setBackgroundColor(option.color)}
              sx={{
                width: 24,
                height: 24,
                minWidth: 24,
                bgcolor: option.color,
                border: backgroundColor === option.color ? 2 : 1,
                borderColor: backgroundColor === option.color ? 'primary.main' : 'grey.300',
                '&:hover': {
                  bgcolor: option.color,
                }
              }}
              title={option.label}
            />
          ))}
        </Box>

        {/* Navigation Controls */}
        <Box sx={{ 
          position: 'fixed',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}>
          <IconButton
            size="large"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            sx={buttonStyles.navigation}
          >
            <ChevronLeft />
          </IconButton>
        </Box>

        <Box sx={{ 
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}>
          <IconButton
            size="large"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            sx={buttonStyles.navigation}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* PDF Display */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          {loading || !isWorkerLoaded ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading PDF...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.reload()} 
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          ) : currentPdfUrl ? (
            <Document
              file={currentPdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading page...</Typography>
                </Box>
              }
              options={{
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/standard_fonts/'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 'calc(100vh - 120px)',
                padding: '20px 0'
              }}>
                <Page
                  key={`page_${pageNumber}`}
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  className={isNightMode ? 'night-mode-page' : ''}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <CircularProgress />
                    </Box>
                  }
                />
                {!isSinglePage && pageNumber < numPages && (
                  <Page
                    key={`page_${pageNumber + 1}`}
                    pageNumber={pageNumber + 1}
                    scale={scale}
                    rotate={rotation}
                    className={isNightMode ? 'night-mode-page' : ''}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CircularProgress />
                      </Box>
                    }
                  />
                )}
              </Box>
            </Document>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>No PDF available</Typography>
            </Box>
          )}
        </Box>

        {/* Page Navigation */}
        <Box sx={{ 
          position: 'fixed', 
          bottom: 20, 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          zIndex: 1000
        }}>
          <Typography sx={{ color: '#fff' }}>
            {isSinglePage 
              ? `Page ${pageNumber} of ${numPages}`
              : `Pages ${pageNumber}-${Math.min(pageNumber + 1, numPages)} of ${numPages}`
            }
          </Typography>
          <TextField
            size="small"
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyPress={handleJumpToPage}
            placeholder="Jump to page"
            sx={{
              width: '100px',
              ml: 2,
              '& .MuiInputBase-root': {
                color: '#fff',
                height: '32px',
                '& input': {
                  padding: '4px 8px',
                  textAlign: 'center',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5) !important',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.7) !important',
                },
              },
              '& input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1,
              },
            }}
            inputProps={{
              min: 1,
              max: numPages,
              style: { color: '#fff' }
            }}
          />
        </Box>
      </Box>
    </>
  );
};

export default PDFViewer;
