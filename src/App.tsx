import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './styles/theme';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Resume from './pages/Resume';
import Chat from './pages/Chat';
import PDFView from './pages/PDFView';
import Footer from './components/Footer';

const AppContent = () => {
  const location = useLocation();
  const isPDFRoute = location.pathname === '/pdf';

  return (
    <div className="App">
      {!isPDFRoute && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/pdf" element={<PDFView />} />
        </Routes>
      </main>
      {!isPDFRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
