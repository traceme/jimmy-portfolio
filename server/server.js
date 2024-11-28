require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve PDF files
app.use('/pdf', express.static(path.join(__dirname, 'pdfs')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model selection is required' });
    }

    let reply;

    switch (model) {
      case 'gpt4':
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant on Jimmy's portfolio website. You can discuss Jimmy's skills, experience, and projects professionally and enthusiastically."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        reply = chatCompletion.choices[0].message.content;
        break;

      case 'gpt3.5':
        const gpt35Completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant on Jimmy's portfolio website. You can discuss Jimmy's skills, experience, and projects professionally and enthusiastically."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        reply = gpt35Completion.choices[0].message.content;
        break;

      case 'claude':
        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: message
            }
          ],
          system: "You are a helpful assistant on Jimmy's portfolio website. You can discuss Jimmy's skills, experience, and projects professionally and enthusiastically."
        });
        reply = claudeResponse.content[0].text;
        break;

      default:
        return res.status(400).json({ error: 'Invalid model selection' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI service',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
