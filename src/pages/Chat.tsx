import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';

// Register languages for syntax highlighting
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  model?: string;
}

type ModelType = 'gpt4' | 'gpt3.5' | 'claude';

// Custom styles for markdown content
const markdownStyles = {
  p: {
    margin: '1rem 0',
    lineHeight: '1.6',
    fontSize: '1rem',
    color: 'rgba(0, 0, 0, 0.87)',
  },
  'h1, h2, h3, h4, h5, h6': {
    margin: '1.5rem 0 1rem',
    lineHeight: '1.3',
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.87)',
  },
  h1: { fontSize: '2rem' },
  h2: { fontSize: '1.75rem' },
  h3: { fontSize: '1.5rem' },
  h4: { fontSize: '1.25rem' },
  h5: { fontSize: '1.1rem' },
  h6: { fontSize: '1rem' },
  'ul, ol': {
    margin: '1rem 0',
    paddingLeft: '2rem',
  },
  li: {
    margin: '0.5rem 0',
    lineHeight: '1.6',
  },
  'ul > li': {
    listStyleType: 'disc',
  },
  'ul > li > ul > li': {
    listStyleType: 'circle',
  },
  'ul > li > ul > li > ul > li': {
    listStyleType: 'square',
  },
  'ol > li': {
    listStyleType: 'decimal',
  },
  a: {
    color: '#2563eb',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  blockquote: {
    margin: '1rem 0',
    padding: '0.5rem 0 0.5rem 1rem',
    borderLeft: '4px solid #e5e7eb',
    color: '#4b5563',
    fontStyle: 'italic',
  },
  table: {
    width: '100%',
    margin: '1rem 0',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  },
  'th, td': {
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#f9fafb',
    fontWeight: '600',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontFamily: '"Fira Code", "Consolas", monospace',
    color: '#1f2937',
  },
  pre: {
    margin: '1rem 0',
    padding: '0',
    backgroundColor: 'transparent',
  },
  hr: {
    margin: '2rem 0',
    border: 'none',
    borderTop: '1px solid #e5e7eb',
  },
  img: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '4px',
    margin: '1rem 0',
  },
  strong: {
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.87)',
  },
  em: {
    fontStyle: 'italic',
  },
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm an AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt3.5');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleModelChange = (event: any) => {
    setSelectedModel(event.target.value as ModelType);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          model: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const aiMessage: Message = {
        text: data.reply,
        isUser: false,
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h2">Chat with AI</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={selectedModel}
              label="Model"
              onChange={handleModelChange}
              disabled={isLoading}
            >
              <MenuItem value="gpt4">GPT-4</MenuItem>
              <MenuItem value="gpt3.5">GPT-3.5</MenuItem>
              <MenuItem value="claude">Claude</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Paper
          elevation={3}
          sx={{
            height: '60vh',
            display: 'flex',
            flexDirection: 'column',
            mb: 2,
            p: 2,
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: message.isUser ? 'primary.main' : 'grey.100',
                    color: message.isUser ? 'white' : 'text.primary',
                  }}
                >
                  {message.isUser ? (
                    <Typography>{message.text}</Typography>
                  ) : (
                    <Box sx={markdownStyles}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneLight}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: '1rem 0',
                                  borderRadius: '6px',
                                  padding: '1rem',
                                  backgroundColor: '#f8f9fa',
                                  fontSize: '0.875rem',
                                  border: '1px solid #e9ecef',
                                }}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </Box>
                  )}
                  {!message.isUser && message.model && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                      via {message.model}
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              multiline
              maxRows={4}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              sx={{ minWidth: '100px' }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <SendIcon />
                </>
              )}
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Chat;
