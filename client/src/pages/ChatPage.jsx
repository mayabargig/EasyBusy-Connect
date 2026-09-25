import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api, getApiErrorMessage } from "../services/api";
import {
  connectChatSocket,
  disconnectChatSocket,
} from "../services/chatSocket";

function displayName(person) {
  return person?.businessName || `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
}

function initials(person) {
  return `${person?.firstName?.[0] || ""}${person?.lastName?.[0] || ""}`;
}

function formatMessageTime(value) {
  return new Intl.DateTimeFormat("en-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function otherUserId(message, currentUserId) {
  return message.sender.id === currentUserId
    ? message.recipient.id
    : message.sender.id;
}

export function ChatPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const activeUserIdRef = useRef(userId || "");
  const messageEndRef = useRef(null);

  useEffect(() => {
    activeUserIdRef.current = userId || "";
  }, [userId]);

  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get("/messages/conversations");
      setConversations(response.data.conversations);
      return response.data.conversations;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      return [];
    }
  }, []);

  const loadConversation = useCallback(async (selectedUserId, query = "") => {
    if (!selectedUserId) {
      setMessages([]);
      setActiveUser(null);
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await api.get(`/messages/with/${selectedUserId}`, {
        params: { q: query || undefined },
      });
      setMessages(response.data.messages);
      setActiveUser(response.data.user);
      setConversations((current) => {
        if (current.some((conversation) => conversation.user.id === selectedUserId)) {
          return current.map((conversation) =>
            conversation.user.id === selectedUserId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          );
        }

        return [
          {
            user: response.data.user,
            lastMessage: response.data.messages.at(-1) || null,
            unreadCount: 0,
          },
          ...current,
        ];
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setMessages([]);
      setActiveUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function initializePage() {
      const loadedConversations = await loadConversations();
      if (!isCurrent) return;

      if (!userId && loadedConversations.length > 0) {
        navigate(`/chat/${loadedConversations[0].user.id}`, { replace: true });
      } else if (!userId) {
        setIsLoading(false);
      }
    }

    initializePage();
    return () => {
      isCurrent = false;
    };
  }, [loadConversations, navigate, userId]);

  useEffect(() => {
    if (userId) loadConversation(userId);
    setMessageSearch("");
    setEditing(null);
  }, [loadConversation, userId]);

  useEffect(() => {
    const socket = connectChatSocket();

    function handleConnect() {
      setIsConnected(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function handleConnectionError(connectionError) {
      setIsConnected(false);
      setError(connectionError.message || "Chat connection failed.");
    }

    async function handleMessage(message) {
      const relatedUserId = otherUserId(message, user.id);
      if (relatedUserId === activeUserIdRef.current) {
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      }
      await loadConversations();
      if (relatedUserId === activeUserIdRef.current) {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.user.id === relatedUserId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );
      }
    }

    function handleUpdatedMessage(message) {
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? message : item)),
      );
      loadConversations();
    }

    function handleDeletedMessage({ messageId }) {
      setMessages((current) => current.filter((message) => message.id !== messageId));
      loadConversations();
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectionError);
    socket.on("chat:message", handleMessage);
    socket.on("chat:message-updated", handleUpdatedMessage);
    socket.on("chat:message-deleted", handleDeletedMessage);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectionError);
      socket.off("chat:message", handleMessage);
      socket.off("chat:message-updated", handleUpdatedMessage);
      socket.off("chat:message-deleted", handleDeletedMessage);
      disconnectChatSocket();
    };
  }, [loadConversations, user.id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectConversation(selectedUserId) {
    navigate(`/chat/${selectedUserId}`);
  }

  function searchMessages(event) {
    event.preventDefault();
    loadConversation(userId, messageSearch);
  }

  function clearMessageSearch() {
    setMessageSearch("");
    loadConversation(userId);
  }

  function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeUser || !isConnected) return;

    setError("");
    setIsSending(true);
    const socket = connectChatSocket();

    socket.timeout(7000).emit(
      "chat:send",
      { recipientId: activeUser.id, content },
      (timeoutError, response) => {
        setIsSending(false);
        if (timeoutError) {
          setError("The chat server did not respond. Please try again.");
          return;
        }
        if (!response?.success) {
          setError(response?.message || "The message could not be sent.");
          return;
        }
        setDraft("");
      },
    );
  }

  async function saveEditedMessage(event) {
    event.preventDefault();
    try {
      const response = await api.patch(`/messages/${editing.id}`, {
        content: editing.content,
      });
      setMessages((current) =>
        current.map((message) =>
          message.id === editing.id ? response.data.chatMessage : message,
        ),
      );
      setEditing(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function deleteMessage(messageId) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  return (
    <section className="chat-page section-container">
      <div className="page-heading chat-heading">
        <div>
          <span className="eyebrow">Real-time community chat</span>
          <h1>Messages</h1>
          <p>Chat directly with {user.role === "customer" ? "business owners" : "customers"}.</p>
        </div>
        <span className={`socket-status ${isConnected ? "online" : "offline"}`}>
          {isConnected ? "Live connection" : "Reconnecting…"}
        </span>
      </div>

      {error && <div className="form-alert page-alert" role="alert">{error}</div>}

      <div className="chat-layout">
        <aside className="conversation-sidebar">
          <h2>Conversations</h2>
          {conversations.length === 0 ? (
            <div className="chat-sidebar-empty">
              <p>No conversations yet.</p>
              {user.role === "customer" && <Link to="/discover">Find a business →</Link>}
            </div>
          ) : (
            <div className="conversation-list">
              {conversations.map((conversation) => (
                <button
                  className={`conversation-button ${userId === conversation.user.id ? "active" : ""}`}
                  key={conversation.user.id}
                  onClick={() => selectConversation(conversation.user.id)}
                  type="button"
                >
                  <span className="chat-avatar">
                    {conversation.user.avatarUrl
                      ? <img alt="" src={conversation.user.avatarUrl} />
                      : initials(conversation.user)}
                  </span>
                  <span className="conversation-preview">
                    <strong>{displayName(conversation.user)}</strong>
                    <small>{conversation.lastMessage?.content || "Start a conversation"}</small>
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>

        <article className="chat-window">
          {!activeUser ? (
            <div className="chat-placeholder">
              <h2>Select a conversation</h2>
              <p>Choose someone from the list or open a chat from a business profile.</p>
            </div>
          ) : (
            <>
              <header className="chat-window-header">
                <span className="chat-avatar">
                  {activeUser.avatarUrl
                    ? <img alt="" src={activeUser.avatarUrl} />
                    : initials(activeUser)}
                </span>
                <div>
                  <h2>{displayName(activeUser)}</h2>
                  <p>{activeUser.city} · {activeUser.role === "business_owner" ? "Business owner" : "Customer"}</p>
                </div>
              </header>

              <form className="message-search" onSubmit={searchMessages}>
                <input onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search this conversation" value={messageSearch} />
                <button className="button secondary" type="submit">Search</button>
                {messageSearch && <button className="text-action-button" onClick={clearMessageSearch} type="button">Clear</button>}
              </form>

              <div className="message-list">
                {isLoading ? (
                  <p className="chat-loading">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <div className="chat-placeholder compact">
                    <h3>{messageSearch ? "No matching messages" : "Start the conversation"}</h3>
                    <p>{messageSearch ? "Try another search phrase." : "Send a message using the field below."}</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender.id === user.id;
                    return (
                      <div className={`message-row ${isOwn ? "own" : "received"}`} key={message.id}>
                        <div className="message-bubble">
                          {editing?.id === message.id ? (
                            <form className="message-edit-form" onSubmit={saveEditedMessage}>
                              <textarea maxLength="1000" onChange={(event) => setEditing((current) => ({ ...current, content: event.target.value }))} required rows="3" value={editing.content} />
                              <div>
                                <button className="text-action-button" type="submit">Save</button>
                                <button className="text-action-button" onClick={() => setEditing(null)} type="button">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <p>{message.content}</p>
                              <small>{formatMessageTime(message.createdAt)}{message.updatedAt !== message.createdAt ? " · edited" : ""}</small>
                              {isOwn && (
                                <div className="message-actions">
                                  <button className="text-action-button" onClick={() => setEditing({ id: message.id, content: message.content })} type="button">Edit</button>
                                  <button className="text-action-button danger-text" onClick={() => deleteMessage(message.id)} type="button">Delete</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              <form className="message-composer" onSubmit={sendMessage}>
                <textarea maxLength="1000" onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" rows="2" value={draft} />
                <button className="button primary" disabled={!draft.trim() || !isConnected || isSending} type="submit">
                  {isSending ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
