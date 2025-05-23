import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import styled from "styled-components";

type Message = {
  role: string;
  content: string;
};
const API_URL =
  import.meta.env.VITE_API_URL || "https://chatgpt-wrapper-api.onrender.com";

const ChatContainer = styled(Paper)`
  max-width: 480px;
  margin: 40px auto;
  border-radius: 16px !important;
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
`;

const MessagesBox = styled(Box)`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const MessageRow = styled(Box)<{ $isUser: boolean }>`
  display: flex;
  flex-direction: ${({ $isUser }) => ($isUser ? "row-reverse" : "row")};
  margin: 12px 0;
`;

const MessageBubble = styled(Box)<{ $isUser: boolean }>`
  color: white;
  padding: 10px 16px;
  border-radius: 18px;
  max-width: 70%;
  word-break: break-word;
  font-size: 16px;
  box-shadow: ${({ $isUser }) =>
    $isUser ? "0 2px 8px #1976d222" : "0 2px 8px #e0e0e022"};
`;

const InputRow = styled(Box)`
  display: flex;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #eee;
`;

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle image selection
  const handleImageChange = (file: File) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;
    setLoading(true);

    let userMessage: any;

    if (image) {
      // Convert image to base64
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

      const imageDataUrl = await toBase64(image);

      userMessage = {
        role: "user",
        content: [
          ...(input.trim() ? [{ type: "text", text: input }] : []),
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      };
    } else {
      userMessage = {
        role: "user",
        content: [{ type: "text", text: input }],
      };
    }

    const body = {
      messages: [...messages, userMessage],
    };

    console.log(JSON.stringify(body));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: window.location.origin,
        },
        credentials: "include", // For cookies if needed
        body: JSON.stringify(body),
      });
      const assistantMessage = await response.json();
      setMessages([...messages, userMessage, assistantMessage]);
      setInput("");
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      // try {
      //   // Instead of fetching, create a mock assistant response directly
      //   const assistantMessage = {
      //     role: "assistant",
      //     content: "I received your message", // Or whatever default response you want
      //   };

      //   setMessages([...messages, userMessage, assistantMessage]);
      //   setInput("");
      //   setImage(null);
      //   setImagePreview(null);
      // } catch (err) {
      // Your existing error handling

      setMessages([
        ...messages,
        userMessage,
        {
          role: "assistant",
          content: [{ type: "text", text: "Error: Could not reach server." }],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  return (
    <ChatContainer elevation={3}>
      <MessagesBox>
        {messages.length === 0 && (
          <Typography color="textSecondary" align="center" sx={{ mt: 10 }}>
            Start the conversation!
          </Typography>
        )}
        {messages.map((msg, i) => (
          <MessageRow key={i} $isUser={msg.role === "user"}>
            <MessageBubble $isUser={msg.role === "user"}>
              {
                typeof msg.content === "string"
                  ? msg.content
                  : Array.isArray(msg.content)
                  ? msg.content.map((item, idx) => (
                      <div key={idx}>
                        {item.type === "text" && item.text}
                        {item.type === "image_url" && (
                          <img
                            src={item.image_url.url}
                            alt="Sent image"
                            style={{
                              maxWidth: "100%",
                              borderRadius: 4,
                              marginTop: 8,
                            }}
                          />
                        )}
                      </div>
                    ))
                  : JSON.stringify(msg.content) // Fallback for any other case
              }
            </MessageBubble>
          </MessageRow>
        ))}
        <div ref={messagesEndRef} />
      </MessagesBox>

      {/* Image preview shown above input when selected */}
      {imagePreview && (
        <Box p={2} display="flex" alignItems="center">
          <img
            src={imagePreview}
            alt="preview"
            style={{ height: 40, borderRadius: 4 }}
          />
          <IconButton
            size="small"
            onClick={() => {
              setImage(null);
              setImagePreview(null);
            }}
            sx={{ ml: 1 }}
          >
            ✕
          </IconButton>
        </Box>
      )}

      <InputRow>
        {/* Image upload button on the left */}
        <IconButton
          color="primary"
          component="label"
          sx={{ mr: 1 }}
          disabled={loading}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment" // Add this to access camera directly
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageChange(e.target.files[0]);
              }
            }}
          />
          <PhotoCamera />
        </IconButton>

        {/* Text input in the middle */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type your query..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
          sx={{
            borderRadius: 2,
            mr: 1,
          }}
        />

        {/* Send button on the right */}
        <IconButton
          color="primary"
          onClick={sendMessage}
          disabled={(!input.trim() && !image) || loading}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </InputRow>
    </ChatContainer>
  );
}
