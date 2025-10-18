import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  ExitToApp,
  Settings,
} from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMeetingDetails, leaveMeeting } from '../store/slices/meetingSlice';
import VideoPlayer from './VideoPlayer';
import ChatPanel from './ChatPanel';
import AdminPanel from './AdminPanel';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const socket = useSocket();
  
  const { currentMeeting, participants, isMuted, isVideoOff, isScreenSharing, loading, error } = useSelector(state => state.meeting);
  const { chatOpen } = useSelector(state => state.ui);

  // WebRTC refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const remoteStreamsRef = useRef({});

  // State
  const [isConnecting, setIsConnecting] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Initialize meeting
  useEffect(() => {
    if (meetingId && user) {
      dispatch(getMeetingDetails(meetingId));
    }
  }, [meetingId, user, dispatch]);

  // Initialize WebRTC when meeting is loaded
  useEffect(() => {
    if (currentMeeting && user) {
      initializeWebRTC();
    }
  }, [currentMeeting, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join meeting room via socket
      socket.joinMeeting(meetingId, user.id, user.username);

      // Set up socket listeners for WebRTC signaling
      setupSocketListeners();

      setIsConnecting(false);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setIsConnecting(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket.socket) return;

    // Handle incoming offers
    socket.socket.on('offer', async (data) => {
      await handleIncomingOffer(data);
    });

    // Handle incoming answers
    socket.socket.on('answer', async (data) => {
      await handleIncomingAnswer(data);
    });

    // Handle incoming ICE candidates
    socket.socket.on('ice-candidate', async (data) => {
      await handleIncomingIceCandidate(data);
    });

    // Handle user joined
    socket.socket.on('user-joined', async (data) => {
      if (data.userId !== user.id) {
        await createPeerConnection(data.userId, false);
      }
    });

    // Handle user left
    socket.socket.on('user-left', (data) => {
      if (peerConnectionsRef.current[data.userId]) {
        peerConnectionsRef.current[data.userId].close();
        delete peerConnectionsRef.current[data.userId];
        delete remoteStreamsRef.current[data.userId];
      }
    });
  };

  const createPeerConnection = async (userId, isInitiator) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamsRef.current[userId] = remoteStream;
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.sendIceCandidate(meetingId, event.candidate, userId);
      }
    };

    peerConnectionsRef.current[userId] = peerConnection;

    if (isInitiator) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.sendOffer(meetingId, offer, userId);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  };

  const handleIncomingOffer = async (data) => {
    const { offer, userId } = data;
    
    if (!peerConnectionsRef.current[userId]) {
      await createPeerConnection(userId, false);
    }

    const peerConnection = peerConnectionsRef.current[userId];
    
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.sendAnswer(meetingId, answer, userId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleIncomingAnswer = async (data) => {
    const { answer, userId } = data;
    const peerConnection = peerConnectionsRef.current[userId];
    
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIncomingIceCandidate = async (data) => {
    const { candidate, userId } = data;
    const peerConnection = peerConnectionsRef.current[userId];
    
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        dispatch({ type: 'meeting/setMuted', payload: !audioTrack.enabled });
        socket.toggleAudio(meetingId, user.id, !audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        dispatch({ type: 'meeting/setVideoOff', payload: !videoTrack.enabled });
        socket.toggleVideo(meetingId, user.id, !videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Get user media again
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Update all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
        
        socket.stopScreenShare(meetingId, user.id, user.username);
        dispatch({ type: 'meeting/setScreenSharing', payload: false });
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Update all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
        
        socket.startScreenShare(meetingId, user.id, user.username);
        dispatch({ type: 'meeting/setScreenSharing', payload: true });
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleLeaveMeeting = () => {
    cleanup();
    dispatch(leaveMeeting());
    navigate('/');
  };

  const cleanup = () => {
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    remoteStreamsRef.current = {};

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Leave socket room
    socket.leaveMeeting(meetingId);
  };

  const isCreator = currentMeeting?.creator?.id === user?.id;

  if (loading || isConnecting) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white' }}>
          {loading ? 'Loading meeting...' : 'Connecting...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 4,
        }}
      >
        <Alert severity="error" sx={{ mb: 3, maxWidth: 400 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ bgcolor: 'white', color: '#1976d2' }}
        >
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <Typography variant="h6">
          {currentMeeting?.title || 'Meeting Room'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={`${participants.length} participants`}
            size="small"
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
          />
          {isCreator && (
            <IconButton
              onClick={() => setShowAdminPanel(true)}
              sx={{ color: 'white' }}
            >
              <Settings />
            </IconButton>
          )}
          <IconButton
            onClick={() => setShowLeaveDialog(true)}
            sx={{ color: 'white' }}
          >
            <ExitToApp />
          </IconButton>
        </Box>
      </Box>

      {/* Video Grid */}
      <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Local Video */}
          <Grid item xs={12} sm={6} md={4}>
            <VideoPlayer
              stream={localStreamRef.current}
              isLocal={true}
              userName={user?.username}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
            />
          </Grid>

          {/* Remote Videos */}
          {Object.entries(remoteStreamsRef.current).map(([userId, stream]) => (
            <Grid item xs={12} sm={6} md={4} key={userId}>
              <VideoPlayer
                stream={stream}
                isLocal={false}
                userName={`User ${userId}`}
                isMuted={false}
                isVideoOff={false}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          background: 'rgba(0,0,0,0.8)',
          padding: 2,
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={toggleAudio}
          sx={{
            bgcolor: isMuted ? '#f44336' : '#4caf50',
            color: 'white',
            '&:hover': { bgcolor: isMuted ? '#d32f2f' : '#388e3c' },
          }}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </IconButton>

        <IconButton
          onClick={toggleVideo}
          sx={{
            bgcolor: isVideoOff ? '#f44336' : '#4caf50',
            color: 'white',
            '&:hover': { bgcolor: isVideoOff ? '#d32f2f' : '#388e3c' },
          }}
        >
          {isVideoOff ? <VideocamOff /> : <Videocam />}
        </IconButton>

        <IconButton
          onClick={toggleScreenShare}
          sx={{
            bgcolor: isScreenSharing ? '#ff9800' : '#1976d2',
            color: 'white',
            '&:hover': { bgcolor: isScreenSharing ? '#f57c00' : '#1565c0' },
          }}
        >
          {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
        </IconButton>

        <IconButton
          onClick={() => dispatch({ type: 'ui/toggleChat' })}
          sx={{
            bgcolor: chatOpen ? '#ff9800' : '#1976d2',
            color: 'white',
            '&:hover': { bgcolor: chatOpen ? '#f57c00' : '#1565c0' },
          }}
        >
          <Chat />
        </IconButton>
      </Box>

      {/* Chat Panel */}
      {chatOpen && (
        <ChatPanel
          meetingId={meetingId}
          onClose={() => dispatch({ type: 'ui/setChatOpen', payload: false })}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && isCreator && (
        <AdminPanel
          meetingId={meetingId}
          participants={participants}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Leave Meeting Dialog */}
      <Dialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)}>
        <DialogTitle>Leave Meeting</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to leave this meeting?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveDialog(false)}>Cancel</Button>
          <Button onClick={handleLeaveMeeting} color="error" variant="contained">
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingRoom;
