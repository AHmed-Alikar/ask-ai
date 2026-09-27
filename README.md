```

```

# Ask AI 🤖

Ask AI is an AI-powered conversational assistant built as a practical AI Engineering project.

The project combines a React frontend, Node.js/Express backend, PostgreSQL database, Hugging Face LLMs, streaming responses, Markdown rendering, and multi-tool function calling.

The main goal of Ask AI is to demonstrate how a modern AI application connects an LLM with a backend, database, external APIs, and specialized tools.

---

## ✨ Features

### AI Chat

- Natural language conversations
- Hugging Face LLM integration
- Context-aware conversations
- Streaming AI responses
- Clear and structured answers

### Conversation Management

- Create new conversations
- Automatically create a conversation when the first message is sent
- View previous conversations
- Open previous conversations
- Delete conversations
- Persist conversations in PostgreSQL

### Response Formatting

- Markdown rendering
- Headings
- Paragraphs
- Bullet lists
- Numbered lists
- Code blocks
- Tables when appropriate
- Clean AI response formatting

### AI Tool Calling

Ask AI can decide when an external tool is required instead of answering everything using the LLM alone.

Currently supported tools:

- 🌤️ Weather
- 🧮 Calculator
- 🕐 Current Time
- 💱 Currency Conversion
- 🔎 Wikipedia Search

### Backend & Security

- Express API
- Request validation
- Request body size limit
- API rate limiting
- Parameterized PostgreSQL queries
- Environment variables for secrets
- `.env` excluded from Git
- Tool input validation

---

# 🧠 How Ask AI Works

A normal question follows this flow:

```text
User
  ↓
React Frontend
  ↓
Node.js / Express
  ↓
Hugging Face LLM
  ↓
Streaming Response
  ↓
React UI
```
