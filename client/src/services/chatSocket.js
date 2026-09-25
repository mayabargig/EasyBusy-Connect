import { io } from "socket.io-client";
import { TOKEN_KEY } from "./api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const chatSocket = io(socketUrl, { autoConnect: false });

export function connectChatSocket() {
  chatSocket.auth = { token: localStorage.getItem(TOKEN_KEY) };
  if (!chatSocket.connected) chatSocket.connect();
  return chatSocket;
}

export function disconnectChatSocket() {
  if (chatSocket.connected) chatSocket.disconnect();
}

export { chatSocket };
