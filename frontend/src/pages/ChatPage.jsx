import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../lib/api";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const { authUser } = useAuthUser();
  const [messageList, setMessageList] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  const conversationId = useMemo(() => {
    if (!authUser || !targetUserId) return null;
    return [authUser._id, targetUserId].sort().join("-");
  }, [authUser, targetUserId]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", targetUserId],
    queryFn: () => getMessages(targetUserId, { limit: 30 }),
    enabled: !!authUser && !!targetUserId,
  });

  useEffect(() => {
    setMessageList([]);
  }, [conversationId]);

  useEffect(() => {
    if (messages) {
      setMessageList((prev) => {
        if (prev.length === 0) return messages;
        const seen = new Set(prev.map((msg) => msg.messageId || msg.createdAt));
        const merged = [...prev];
        for (const msg of messages) {
          const key = msg.messageId || msg.createdAt;
          if (!seen.has(key)) {
            merged.push(msg);
            seen.add(key);
          }
        }
        return merged.sort((a, b) => a.createdAt - b.createdAt);
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!authUser) return;
    const socketUrl =
      import.meta.env.MODE === "development"
        ? "http://localhost:5001"
        : window.location.origin;
    const socket = io(socketUrl, { withCredentials: true });
    socketRef.current = socket;

    socket.on("message:new", (message) => {
      if (!conversationId || message.conversationId !== conversationId) return;
      setMessageList((prev) => [...prev, message]);
    });
    socket.on("typing:start", (payload) => {
      if (payload?.fromUserId !== targetUserId) return;
      setIsTyping(true);
    });
    socket.on("typing:stop", (payload) => {
      if (payload?.fromUserId !== targetUserId) return;
      setIsTyping(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authUser, conversationId]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    const text = newMessage.trim();
    if (!text || !socketRef.current || !targetUserId) return;
    const clientId = crypto.randomUUID();
    const optimisticMessage = {
      conversationId,
      createdAt: Date.now(),
      messageId: clientId,
      senderId: authUser?._id,
      receiverId: targetUserId,
      text,
      status: "sending",
      clientId,
    };
    setMessageList((prev) => [...prev, optimisticMessage]);
    socketRef.current.emit(
      "message:send",
      { toUserId: targetUserId, text, clientId },
      (ack) => {
        if (!ack?.ok) {
          setMessageList((prev) =>
            prev.map((msg) =>
              msg.clientId === clientId ? { ...msg, status: "failed" } : msg
            )
          );
          toast.error("Message failed to send");
          return;
        }
        setMessageList((prev) =>
          prev.map((msg) =>
            msg.clientId === ack.clientId
              ? { ...ack.message, status: "delivered" }
              : msg
          )
        );
      }
    );
    setNewMessage("");
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    if (!socketRef.current || !targetUserId) return;
    socketRef.current.emit("typing:start", { toUserId: targetUserId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop", { toUserId: targetUserId });
    }, 800);
  };

  const handleLoadEarlier = async () => {
    const oldest = messageList[0];
    if (!oldest) return;
    const older = await getMessages(targetUserId, {
      before: oldest.createdAt,
      limit: 30,
    });
    if (older.length === 0) {
      toast("No more messages");
      return;
    }
    setMessageList((prev) => [...older, ...prev]);
  };

  if (isLoading) return <ChatLoader />;

  return (
    <div className="h-[93vh] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={handleLoadEarlier}
          >
            Load earlier
          </button>
        </div>
        {messageList.length === 0 ? (
          <div className="text-center text-sm opacity-60">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messageList.map((message) => {
            const isMe = message.senderId === authUser?._id;
            return (
              <div
                key={message.messageId || message.createdAt}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                    isMe
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  <div>{message.text}</div>
                  <div className="text-[10px] opacity-60 mt-1 flex items-center gap-2">
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span>
                        {message.status === "failed"
                          ? "Failed"
                          : message.status === "sending"
                          ? "Sending…"
                          : "Delivered"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="text-xs opacity-60">Typing…</div>
        )}
      </div>
      <form
        onSubmit={handleSendMessage}
        className="border-t p-3 flex items-center gap-2"
      >
        <input
          value={newMessage}
          onChange={(event) => handleTyping(event.target.value)}
          className="input input-bordered w-full"
          placeholder="Type a message..."
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
};
export default ChatPage;
