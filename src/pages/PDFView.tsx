import React from 'react';
import PDFViewer from '../components/PDFViewer';
import { Box } from '@mui/material';

const PDFView: React.FC = () => {
  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: '#1a1a1a'
    }}>
      <PDFViewer pdfUrl="http://localhost:3001/pdf/third_eye_articles.pdf" />
    </Box>
  );
};

export default PDFView;
