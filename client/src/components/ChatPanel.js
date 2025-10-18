import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Send,
  Close,
} from '@mui/icons-material';

const ChatPanel = ({ meetingId, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const { messages } = useSelector(state => state.meeting);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket.sendMessage) {
      socket.sendMessage(meetingId, newMessage.trim(), user.username);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 20,
        top: 80,
        width: 350,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.userId === user.id ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: message.userId === user.id ? 'primary.main' : 'secondary.main',
                  }}
                >
                  {message.userName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {message.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(message.timestamp)}
                </Typography>
              </Box>
              
              <Box
                sx={{
                  maxWidth: '80%',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: message.userId === user.id ? 'primary.main' : 'grey.100',
                  color: message.userId === user.id ? 'white' : 'text.primary',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body2">
                  {message.message}
                </Typography>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          color="primary"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
