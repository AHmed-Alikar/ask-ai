import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = "http://localhost:5000";

function cleanMarkdown(text) {
  if (!text) {
    return "";
  }

  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "\n\n");
}

function App() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/conversations`
      );

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();

      setConversations(data);
    } catch (error) {
      console.error("Load conversations error:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  const createNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setMessage("");
  };

  const openChat = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${id}/messages`
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();

      setConversationId(id);
      setMessages(data);
    } catch (error) {
      console.error("Open chat error:", error);
    }
  };

  const deleteChat = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      setConversations((prev) =>
        prev.filter((chat) => chat.id !== id)
      );

      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Delete chat error:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading) {
      return;
    }

    let activeConversationId = conversationId;

    // Create conversation only when first message is sent
    if (!activeConversationId) {
      try {
        const response = await fetch(
          `${API_URL}/api/conversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: message.trim().slice(0, 40),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create conversation");
        }

        const newChat = await response.json();

        activeConversationId = newChat.id;

        setConversationId(newChat.id);

        setConversations((prev) => [
          newChat,
          ...prev,
        ]);
      } catch (error) {
        console.error(
          "Create conversation error:",
          error
        );

        return;
      }
    }

    const userMessage = message.trim();

    setMessage("");
    setLoading(true);

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    try {
      const response = await fetch(
        `${API_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: activeConversationId,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Chat request failed.";

        try {
          const errorData = await response.json();

          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("No response stream received.");
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let answer = "";

      // Create empty assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, {
          stream: true,
        });

        answer += chunk;

        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            role: "assistant",
            content: answer,
          };

          return updated;
        });
      }

      // Refresh chat list
      await loadConversations();
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-top">

          <div className="brand">
            <div className="brand-icon">
              AI
            </div>

            <span>Ask AI</span>
          </div>

          <button
            className="new-chat"
            onClick={createNewChat}
          >
            <span>+</span>
            New Chat
          </button>

        </div>

        <div className="history">

          <div className="history-title">
            Chats
          </div>

          {loadingChats ? (
            <div className="empty-history">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-history">
              No chats yet
            </div>
          ) : (
            conversations.map((chat) => (
              <div
                className={`chat-item ${
                  conversationId === chat.id
                    ? "active"
                    : ""
                }`}
                key={chat.id}
              >

                <button
                  className="chat-title"
                  onClick={() =>
                    openChat(chat.id)
                  }
                >
                  {chat.title}
                </button>

                <button
                  className="delete-button"
                  onClick={() =>
                    deleteChat(chat.id)
                  }
                  title="Delete chat"
                >
                  ×
                </button>

              </div>
            ))
          )}

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <div>
            <h1>Ask AI</h1>

            <span className="status">
              AI Assistant
            </span>
          </div>

        </header>

        {/* CHAT */}

        <div className="chat">

          {messages.length === 0 && (
            <div className="welcome">

              <div className="welcome-icon">
                AI
              </div>

              <h2>
                How can I help you?
              </h2>

              <p>
                Ask anything and get a clear answer.
              </p>

            </div>
          )}

          {messages.map((msg, index) => {

            const cleanedContent =
              cleanMarkdown(msg.content);

            return (
              <div
                className={`message-row ${msg.role}`}
                key={index}
              >

                <div className="message-wrapper">

                  <div className="message-label">
                    {msg.role === "user"
                      ? "You"
                      : "Ask AI"}
                  </div>

                  <div className="message">

                    <div className="message-content">

                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm,
                          ]}
                        >
                          {cleanedContent}
                        </ReactMarkdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}

                    </div>

                  </div>

                </div>

              </div>
            );
          })}

          {loading && (
            <div className="message-row assistant">

              <div className="message-wrapper">

                <div className="message-label">
                  Ask AI
                </div>

                <div className="message thinking">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* INPUT */}

        <div className="input-container">

          <form
            className="input-area"
            onSubmit={sendMessage}
          >

            <input
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Message Ask AI..."
              disabled={loading}
            />

            <button
              type="submit"
              disabled={
                loading ||
                !message.trim()
              }
            >
              ↑
            </button>

          </form>

          <div className="input-note">
            Ask AI can make mistakes. Check important information.
          </div>

        </div>

      </main>

    </div>
  );
}

export default App;