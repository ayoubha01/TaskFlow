import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Connects to the socket server for a given project and wires up event handlers.
 * handlers: { "task:created": fn, "task:statusChanged": fn, "task:updated": fn, "task:deleted": fn }
 */

export function useSocket(projectId, handlers) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem("taskflow_token");
    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("project:join", projectId, (ack) => {
        if (!ack?.ok) {
          console.error("Failed to join project room:", ack?.error);
        }
      });
    });

    const events = [
      "task:created",
      "task:statusChanged",
      "task:updated",
      "task:deleted",
      "task:commented",
      "task:attached",
    ];
    events.forEach((event) => {
      socket.on(event, (payload) => handlersRef.current?.[event]?.(payload));
    });

    return () => {
      socket.emit("project:leave", projectId);
      socket.disconnect();
    };
  }, [projectId]);

  return socketRef;
}