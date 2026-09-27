# Ask AI

Ask AI is an AI-powered conversational assistant built to demonstrate modern AI application engineering concepts.

It combines a React frontend, Node.js/Express backend, PostgreSQL persistence, Hugging Face LLMs, streaming responses, Markdown rendering, and multi-tool function calling.

---

## ✨ Features

- AI-powered conversations
- Streaming AI responses
- Persistent conversation history
- Create new chats
- Open previous conversations
- Delete conversations
- Markdown rendering
- Code block rendering
- Tables and structured responses
- PostgreSQL database
- Hugging Face LLM integration
- Tool calling
- Weather tool
- Calculator tool
- Current time tool
- Currency conversion tool
- Wikipedia search tool
- API rate limiting
- Request validation
- Environment variable based secrets

---

## 🧠 AI Tools

Ask AI can use external tools when a question requires additional information or computation.

### Weather

```text
User
↓
LLM
↓
get_weather
↓
Weather API
↓
LLM
↓
Answer
```
