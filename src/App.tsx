import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './styles/theme';
import { pdfjs } from 'react-pdf';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Resume from './pages/Resume';
import Chat from './pages/Chat';
import PDFView from './pages/PDFView';
import Footer from './components/Footer';
import BookLibrary from './components/BookLibrary';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const AppContent = () => {
  const location = useLocation();
  const isPDFRoute = location.pathname.startsWith('/pdf-view/');

  return (
    <div className="App">
      {!isPDFRoute && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/pdf-view/:bookId" element={<PDFView />} />
          <Route path="/library" element={<BookLibrary />} />
        </Routes>
      </main>
      {!isPDFRoute && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Router>
  );
};

export default App;
