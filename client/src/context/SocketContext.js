import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { addParticipant, removeParticipant, addMessage, setScreenSharing, setMuted, setVideoOff } from '../store/slices/meetingSlice';
import { addNotification } from '../store/slices/uiSlice';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          userId: user.id,
          userName: user.username,
        },
      });

      setSocket(newSocket);

      // Connection event listeners
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Meeting event listeners
      newSocket.on('user-joined', (data) => {
        console.log('User joined:', data);
        dispatch(addParticipant({
          userId: data.userId,
          userName: data.userName,
          socketId: data.socketId,
          isActive: true,
        }));
        dispatch(addNotification({
          type: 'info',
          message: `${data.userName} joined the meeting`,
        }));
      });

      newSocket.on('user-left', (data) => {
        console.log('User left:', data);
        dispatch(removeParticipant(data.userId));
        dispatch(addNotification({
          type: 'info',
          message: `${data.userName} left the meeting`,
        }));
      });

      // WebRTC signaling events are handled in MeetingRoom component

      // Chat events
      newSocket.on('receive-message', (data) => {
        console.log('Received message:', data);
        dispatch(addMessage(data));
      });

      // Screen sharing events
      newSocket.on('user-started-screen-share', (data) => {
        console.log('User started screen share:', data);
        dispatch(addNotification({
          type: 'info',
          message: `${data.userName} started screen sharing`,
        }));
      });

      newSocket.on('user-stopped-screen-share', (data) => {
        console.log('User stopped screen share:', data);
        dispatch(addNotification({
          type: 'info',
          message: `${data.userName} stopped screen sharing`,
        }));
      });

      // Audio/Video toggle events
      newSocket.on('user-toggled-audio', (data) => {
        console.log('User toggled audio:', data);
        // Update participant audio state
      });

      newSocket.on('user-toggled-video', (data) => {
        console.log('User toggled video:', data);
        // Update participant video state
      });

      // Admin control events
      newSocket.on('admin-muted-user', (data) => {
        console.log('Admin muted user:', data);
        if (data.targetUserId === user.id) {
          dispatch(setMuted(data.isMuted));
          dispatch(addNotification({
            type: 'warning',
            message: data.isMuted ? 'You have been muted by admin' : 'You have been unmuted by admin',
          }));
        }
      });

      newSocket.on('admin-toggled-user-video', (data) => {
        console.log('Admin toggled user video:', data);
        if (data.targetUserId === user.id) {
          dispatch(setVideoOff(data.isVideoOff));
          dispatch(addNotification({
            type: 'warning',
            message: data.isVideoOff ? 'Your video has been turned off by admin' : 'Your video has been turned on by admin',
          }));
        }
      });

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user, dispatch]);

  const joinMeeting = (meetingId, userId, userName) => {
    if (socket) {
      socket.emit('join-meeting', { meetingId, userId, userName });
    }
  };

  const leaveMeeting = (meetingId) => {
    if (socket) {
      socket.emit('leave-meeting', { meetingId });
    }
  };

  const sendOffer = (meetingId, offer, targetUserId) => {
    if (socket) {
      console.log('Sending offer to server:', { meetingId, offer, targetUserId });
      socket.emit('offer', { meetingId, offer, targetUserId });
    }
  };

  const sendAnswer = (meetingId, answer, targetUserId) => {
    if (socket) {
      console.log('Sending answer to server:', { meetingId, answer, targetUserId });
      socket.emit('answer', { meetingId, answer, targetUserId });
    }
  };

  const sendIceCandidate = (meetingId, candidate, targetUserId) => {
    if (socket) {
      console.log('Sending ICE candidate to server:', { meetingId, candidate, targetUserId });
      socket.emit('ice-candidate', { meetingId, candidate, targetUserId });
    }
  };

  const sendMessage = (meetingId, message, userName) => {
    if (socket) {
      socket.emit('send-message', { meetingId, message, userName, userId: user.id });
    }
  };

  const startScreenShare = (meetingId, userId, userName) => {
    if (socket) {
      socket.emit('start-screen-share', { meetingId, userId, userName });
      dispatch(setScreenSharing(true));
    }
  };

  const stopScreenShare = (meetingId, userId, userName) => {
    if (socket) {
      socket.emit('stop-screen-share', { meetingId, userId, userName });
      dispatch(setScreenSharing(false));
    }
  };

  const toggleAudio = (meetingId, userId, isMuted) => {
    if (socket) {
      socket.emit('toggle-audio', { meetingId, userId, isMuted });
      dispatch(setMuted(isMuted));
    }
  };

  const toggleVideo = (meetingId, userId, isVideoOff) => {
    if (socket) {
      socket.emit('toggle-video', { meetingId, userId, isVideoOff });
      dispatch(setVideoOff(isVideoOff));
    }
  };

  const adminMuteUser = (meetingId, targetUserId, isMuted) => {
    if (socket) {
      socket.emit('admin-mute-user', { meetingId, targetUserId, isMuted });
    }
  };

  const adminToggleUserVideo = (meetingId, targetUserId, isVideoOff) => {
    if (socket) {
      socket.emit('admin-toggle-user-video', { meetingId, targetUserId, isVideoOff });
    }
  };

  const value = {
    socket,
    isConnected,
    joinMeeting,
    leaveMeeting,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendMessage,
    startScreenShare,
    stopScreenShare,
    toggleAudio,
    toggleVideo,
    adminMuteUser,
    adminToggleUserVideo,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
