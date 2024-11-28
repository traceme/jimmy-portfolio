import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Box, IconButton, ButtonGroup, Button, GlobalStyles } from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Brightness4, 
  Brightness7,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const backgroundOptions = [
  { label: 'Darkest', color: '#1a1a1a', textBrightness: 65 },
  { label: 'Dark', color: '#2a2a2a', textBrightness: 80 },
  { label: 'Medium', color: '#4a4a4a', textBrightness: 95 },
  { label: 'Light', color: '#f0f0f0', textBrightness: 110 },
  { label: 'Lightest', color: '#ffffff', textBrightness: 135 },
];

// Night mode colors for eye protection
const nightModeColors = {
  background: '#1a1a1a',     // Darker background
  page: '#1a1a1a',          // Same as background for consistency
  text: '#e0e0e0',         // Soft white text
  overlay: 'rgba(255, 247, 230, 0.02)', // Very subtle warm overlay
};

interface PDFViewerProps {
  pdfUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentSpread, setCurrentSpread] = useState<number>(1);
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0]);

  useEffect(() => {
    // Apply background color and night mode styles to PDF pages
    const pages = document.querySelectorAll('.react-pdf__Page');
    pages.forEach(page => {
      if (page instanceof HTMLElement) {
        page.style.backgroundColor = isNightMode ? nightModeColors.page : selectedBackground.color;
      }
    });

    // Apply night mode styles to canvas elements (PDF content)
    const canvases = document.querySelectorAll('.react-pdf__Page canvas');
    canvases.forEach(canvas => {
      if (canvas instanceof HTMLCanvasElement) {
        if (isNightMode) {
          canvas.style.filter = 'invert(100%)';
          canvas.style.mixBlendMode = 'difference';
          canvas.style.backgroundColor = nightModeColors.page;
        } else {
          canvas.style.filter = 'none';
          canvas.style.mixBlendMode = 'normal';
          canvas.style.backgroundColor = 'transparent';
        }
      }
    });
  }, [isNightMode, selectedBackground]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      changeSpread(-2);
    } else if (event.key === 'ArrowRight') {
      changeSpread(2);
    } else if (event.key === 'f') {
      toggleFullscreen();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changeSpread = (delta: number) => {
    setCurrentSpread(prev => {
      const newSpread = prev + delta;
      if (numPages === null) return prev;
      return Math.min(Math.max(1, newSpread), numPages - 1);
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const getBackgroundColor = () => {
    return isNightMode ? nightModeColors.background : '#ffffff';
  };

  return (
    <>
      <GlobalStyles
        styles={{
          '.night-mode-page': {
            backgroundColor: '#1a1a1a !important',
            '& canvas': {
              filter: `invert(92%) brightness(${selectedBackground.textBrightness}%) contrast(130%) sepia(10%) !important`,
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
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: isNightMode ? nightModeColors.background : getBackgroundColor(),
          color: isNightMode ? nightModeColors.text : '#000000',
          transition: 'all 0.5s ease',
        }}
      >
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

        {/* Background selector */}
        <ButtonGroup 
          variant="contained" 
          sx={{ 
            position: 'fixed',
            bottom: 20,
            right: '50%',
            transform: 'translateX(50%) scale(0.5)',
            transformOrigin: 'center center',
            zIndex: 1001,
            gap: '4px',
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'row',
            '& .MuiButton-root': {
              minWidth: '32px',
              height: '28px',
              px: 1,
              fontSize: '11px',
              color: isNightMode ? '#fff' : '#000',
              border: 'none',
              transition: 'all 0.3s ease',
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
              },
              '&.Mui-selected': {
                opacity: 1,
              }
            }
          }}
        >
          {backgroundOptions.map((option) => (
            <Button
              key={option.color}
              onClick={() => setSelectedBackground(option)}
              sx={{
                backgroundColor: `${option.color} !important`,
                outline: selectedBackground.color === option.color ? '2px solid #4a90e2' : 'none',
                backdropFilter: 'blur(5px)',
                '&:hover': {
                  backgroundColor: `${option.color} !important`,
                },
              }}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>

        {/* Navigation Controls */}
        <Box sx={{ position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 1001 }}>
          <IconButton 
            onClick={() => changeSpread(-2)} 
            disabled={currentSpread <= 1}
            sx={{ 
              color: isNightMode ? '#fff' : '#000', 
              backgroundColor: 'rgba(128, 128, 128, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
              },
              '&.Mui-disabled': {
                color: isNightMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Box>

        <Box sx={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 1001 }}>
          <IconButton 
            onClick={() => changeSpread(2)} 
            disabled={numPages !== null && currentSpread + 1 >= numPages}
            sx={{ 
              color: isNightMode ? '#fff' : '#000', 
              backgroundColor: 'rgba(128, 128, 128, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
              },
              '&.Mui-disabled': {
                color: isNightMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Control Buttons */}
        <Box sx={{ position: 'fixed', top: 20, left: 20, zIndex: 1001, display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={() => setIsNightMode(!isNightMode)}
            sx={{ 
              color: isNightMode ? '#fff' : '#000', 
              backgroundColor: 'rgba(128, 128, 128, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
              }
            }}
          >
            {isNightMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <IconButton 
            onClick={toggleFullscreen}
            sx={{ 
              color: isNightMode ? '#fff' : '#000', 
              backgroundColor: 'rgba(128, 128, 128, 0.1)',
              zIndex: 1002,
              '&:hover': {
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
              }
            }}
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Box>

        {/* PDF Display */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: '20px',
            zIndex: 2,
            '& .react-pdf__Document': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <Box sx={{ 
                color: isNightMode ? nightModeColors.text : '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                Loading PDF...
              </Box>
            }
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ 
                backgroundColor: isNightMode ? nightModeColors.page : selectedBackground.color,
                borderRadius: '4px',
                boxShadow: isNightMode 
                  ? '0 0 20px rgba(0, 0, 0, 0.5)' 
                  : '0 0 10px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.5s ease',
                padding: '8px',
                position: 'relative',
              }}>
                <Page
                  pageNumber={currentSpread}
                  scale={1.25}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className={isNightMode ? 'night-mode-page' : ''}
                />
              </Box>
              {numPages !== null && currentSpread + 1 <= numPages && (
                <Box sx={{ 
                  backgroundColor: isNightMode ? nightModeColors.page : selectedBackground.color,
                  borderRadius: '4px',
                  boxShadow: isNightMode 
                    ? '0 0 20px rgba(0, 0, 0, 0.5)' 
                    : '0 0 10px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.5s ease',
                  padding: '8px',
                  position: 'relative',
                }}>
                  <Page
                    pageNumber={currentSpread + 1}
                    scale={1.25}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className={isNightMode ? 'night-mode-page' : ''}
                  />
                </Box>
              )}
            </Box>
          </Document>
        </Box>
      </Box>
    </>
  );
};

export default PDFViewer;
