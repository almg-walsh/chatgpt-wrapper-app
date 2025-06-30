import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";

// Add this declaration to extend ImportMeta for Vite env variables
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Message = {
  role: string;
  content: string;
};
const API_URL =
  import.meta.env.VITE_API_URL || "https://chatgpt-wrapper-api.onrender.com";

const ChatContainer = styled(Paper)`
  max-width: 100%;
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
  const [conversations, setConversations] = useState<Message[][]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load all conversations on mount
  useEffect(() => {
    const base = import.meta.env.BASE_URL || "/";

    console.log(`${base}openai-formatted-all.json`);
    fetch(`${base}openai-formatted-all.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load chat history");
        return res.json();
      })
      .then((data) => {
        // If data is a flat array, wrap it as a single conversation
        if (Array.isArray(data) && data.length > 0 && !Array.isArray(data[0])) {
          setConversations([data]);
        } else if (Array.isArray(data)) {
          setConversations(data);
        }
      })
      .catch((err) => {
        console.error("Error loading chat history:", err);
      });
  }, []);

  // Handle image selection
  const handleImageChange = (file: File) => {
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Add this function to handle import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const text = await e.target.files[0].text();
      try {
        const importedMessages = JSON.parse(text);
        setMessages(importedMessages);
      } catch (err) {
        alert("Invalid file format");
      }
    }
  };

  // When switching tabs, reset input/image as needed
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setInput("");
    setImage(null);
    setImagePreview(null);
  };

  // Send message in the active conversation
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
      messages: [...(conversations[activeTab] || []), userMessage],
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
      setConversations((prev) => {
        const updated = [...prev];
        updated[activeTab] = [
          ...(updated[activeTab] || []),
          userMessage,
          assistantMessage,
        ];
        return updated;
      });
      setInput("");
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      setConversations((prev) => {
        const updated = [...prev];
        updated[activeTab] = [
          ...(updated[activeTab] || []),
          userMessage,
          {
            role: "assistant",
            content: [{ type: "text", text: "Error: Could not reach server." }],
          },
        ];
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) sendMessage();
  };

  return (
    <ChatContainer elevation={3}>
      {/* Tabs for each conversation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        {conversations.map((_, idx) => (
          <Tab key={idx} label={`Chat ${idx + 1}`} />
        ))}
      </Tabs>

      <MessagesBox>
        {conversations[activeTab]?.length === 0 && (
          <Typography color="textSecondary" align="center" sx={{ mt: 10 }}>
            Start the conversation!
          </Typography>
        )}
        {conversations[activeTab]?.map((msg, i) => (
          <MessageRow key={i} $isUser={msg.role === "user"}>
            <MessageBubble $isUser={msg.role === "user"}>
              {typeof msg.content === "string" ? (
                msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )
              ) : Array.isArray(msg.content) ? (
                msg.content?.map((item, idx) =>
                  item.type === "text" ? (
                    <ReactMarkdown key={idx}>{item.text}</ReactMarkdown>
                  ) : item.type === "image_url" ? (
                    <img
                      key={idx}
                      src={item.image_url.url}
                      alt="Sent image"
                      style={{
                        maxWidth: "100%",
                        borderRadius: 4,
                        marginTop: 8,
                      }}
                    />
                  ) : null
                )
              ) : (
                JSON.stringify(msg.content)
              )}
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
        {/* Camera button */}
        <IconButton
          color="primary"
          component="label"
          sx={{ mr: 0.5 }}
          disabled={loading}
          title="Take a photo"
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageChange(e.target.files[0]);
              }
            }}
          />
          <PhotoCamera />
        </IconButton>

        {/* Gallery button */}
        <IconButton
          color="primary"
          component="label"
          sx={{ mr: 1 }}
          disabled={loading}
          title="Choose from gallery"
        >
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageChange(e.target.files[0]);
              }
            }}
          />
          <PhotoLibraryIcon />
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
