import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

/**
 * Opens exactly ONE Socket.IO connection for the whole project board, shared by
 * Board and any open TaskModal. Previously each component opened its own socket,
 * which under React StrictMode's double-effect-invocation caused connections to be
 * torn down mid-handshake ("WebSocket is closed before the connection is
 * established") and could leave the tree in an inconsistent state.
 */
export function SocketProvider({ projectId, children }) {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map()); // event name -> Set of handler fns
  const [ctxValue, setCtxValue] = useState(null);

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
      socket.on(event, (payload) => {
        listenersRef.current.get(event)?.forEach((fn) => fn(payload));
      });
    });

    function subscribe(event, handler) {
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event).add(handler);
      return () => listenersRef.current.get(event)?.delete(handler);
    }

    setCtxValue({ subscribe });

    return () => {
      socket.emit("project:leave", projectId);
      socket.disconnect();
      socketRef.current = null;
      setCtxValue(null);
    };
  }, [projectId]);

  return <SocketContext.Provider value={ctxValue}>{children}</SocketContext.Provider>;
}

/**
 * Subscribe to project socket events from any descendant of SocketProvider.
 * handlers: { "task:created": fn, "task:commented": fn, ... }
 * Safe to pass a new handlers object every render — only re-subscribes if the
 * underlying connection itself changes.
 */
export function useProjectSocket(handlers) {
  const ctx = useContext(SocketContext);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!ctx) return;

    const unsubscribers = Object.keys(handlersRef.current).map((event) =>
      ctx.subscribe(event, (payload) => handlersRef.current[event]?.(payload))
    );

    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);
}