import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import styled from 'styled-components';

type Message = {
  role: string;
  content: string;
};

const API_URL = 'http://localhost:8080/chat'; // Change to your backend URL in production

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
  background: #f7f7fa;
`;

const MessageRow = styled(Box)<{ $isUser: boolean }>`
  display: flex;
  flex-direction: ${({ $isUser }) => ($isUser ? 'row-reverse' : 'row')};
  margin: 12px 0;
`;

const MessageBubble = styled(Box)<{ $isUser: boolean }>`
  background: ${({ $isUser }) => ($isUser ? '#1976d2' : '#e0e0e0')};
  color: ${({ $isUser }) => ($isUser ? '#fff' : '#222')};
  padding: 10px 16px;
  border-radius: 18px;
  max-width: 70%;
  word-break: break-word;
  font-size: 16px;
  box-shadow: ${({ $isUser }) =>
    $isUser ? '0 2px 8px #1976d222' : '0 2px 8px #e0e0e022'};
`;

const InputRow = styled(Box)`
  display: flex;
  padding: 16px;
  border-top: 1px solid #eee;
  background: #fafbfc;
`;

export default function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage = { role: 'user', content: input };
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const assistantMessage = await response.json();
      setMessages([...messages, userMessage, assistantMessage]);
      setInput('');
    } catch (err) {
      setMessages([
        ...messages,
        userMessage,
        { role: 'assistant', content: 'Error: Could not reach server.' },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) sendMessage();
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
          <MessageRow key={i} $isUser={msg.role === 'user'}>
            <MessageBubble $isUser={msg.role === 'user'}>
              {msg.content}
            </MessageBubble>
          </MessageRow>
        ))}
        <div ref={messagesEndRef} />
      </MessagesBox>
      <InputRow>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type your query..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
          sx={{
            background: '#fff',
            borderRadius: 2,
            mr: 1,
          }}
        />
        <IconButton
          color="primary"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          size="large"
        >
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </InputRow>
    </ChatContainer>
  );
}