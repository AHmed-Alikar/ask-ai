const express = require("express");
const cors = require("cors");
require("dotenv").config();

const rateLimit = require("express-rate-limit");

const { streamAI } = require("./ai");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Rate limit
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests. Please try again later.",
  },
});


// ======================================
// BASIC
// ======================================

app.get("/", (req, res) => {
  res.json({
    message: "Ask AI API is running",
  });
});


// ======================================
// DATABASE TEST
// ======================================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      error: "Database connection failed",
    });
  }
});


// ======================================
// CREATE NEW CONVERSATION
// ======================================

app.post("/api/conversations", async (req, res) => {
  try {
    const { title } = req.body;

    const result = await db.query(
      `INSERT INTO conversations (title)
       VALUES ($1)
       RETURNING *`,
      [title || "New Chat"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create conversation error:", error);

    res.status(500).json({
      error: "Failed to create conversation",
    });
  }
});


// ======================================
// GET ALL CONVERSATIONS
// ======================================

app.get("/api/conversations", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM conversations
       ORDER BY updated_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      error: "Failed to get conversations",
    });
  }
});


// ======================================
// GET MESSAGES OF A CONVERSATION
// ======================================

app.get("/api/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT *
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      error: "Failed to get messages",
    });
  }
});


// ======================================
// DELETE CONVERSATION
// ======================================

app.delete("/api/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM conversations
       WHERE id = $1`,
      [id]
    );

    res.json({
      message: "Conversation deleted",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    res.status(500).json({
      error: "Failed to delete conversation",
    });
  }
});


// ======================================
// CHAT + STREAMING
// ======================================

app.post("/api/chat", chatLimiter, async (req, res) => {
  const { message, conversationId } = req.body || {};

  // Validate message
  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "Message is required and must be text.",
    });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({
      error: "Message cannot be empty.",
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      error: "Message is too long. Maximum 2000 characters.",
    });
  }

  if (!conversationId) {
    return res.status(400).json({
      error: "Conversation ID is required.",
    });
  }

  try {
    // ----------------------------------
    // 1. Check conversation exists
    // ----------------------------------

    const conversationResult = await db.query(
      `SELECT *
       FROM conversations
       WHERE id = $1`,
      [conversationId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: "Conversation not found.",
      });
    }


    // ----------------------------------
    // 2. Get previous messages
    // ----------------------------------

    const messagesResult = await db.query(
      `SELECT role, content
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Answer clearly and simply.",
      },
      ...messagesResult.rows,
      {
        role: "user",
        content: message,
      },
    ];


    // ----------------------------------
    // 3. Save user message
    // ----------------------------------

    await db.query(
      `INSERT INTO messages
       (conversation_id, role, content)
       VALUES ($1, $2, $3)`,
      [conversationId, "user", message]
    );


    // ----------------------------------
    // 4. Update conversation time
    // ----------------------------------

    await db.query(
      `UPDATE conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [conversationId]
    );


    // ----------------------------------
    // 5. Start streaming
    // ----------------------------------

    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    let answer = "";

    const stream = await  streamAI(messages);

    for await (const chunk of stream) {
      const text =
        chunk.choices?.[0]?.delta?.content || "";

      if (text) {
        answer += text;

        // Send chunk to frontend
        res.write(text);
      }
    }


    // ----------------------------------
    // 6. Save AI response
    // ----------------------------------

    await db.query(
      `INSERT INTO messages
       (conversation_id, role, content)
       VALUES ($1, $2, $3)`,
      [conversationId, "assistant", answer]
    );


    // ----------------------------------
    // 7. Update conversation time
    // ----------------------------------

    await db.query(
      `UPDATE conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [conversationId]
    );


    res.end();

  } catch (error) {
    console.error("AI request failed:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "AI request failed",
      });
    }

    res.end();
  }
});


// ======================================
// START SERVER
// ======================================

app.listen(process.env.PORT, () => {
  console.log(
    `Ask AI API running on port ${process.env.PORT}`
  );
});