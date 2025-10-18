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
  const [remoteStreams, setRemoteStreams] = useState({});

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

  // Clean up undefined connections whenever participants change
  useEffect(() => {
    console.log('🔄 Participants changed, cleaning up undefined connections...');
    cleanupUndefinedConnections();
  }, [participants]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic check to ensure all participants have peer connections
  useEffect(() => {
    if (participants && participants.length > 1) {
      const interval = setInterval(() => {
        // Clean up undefined connections first
        cleanupUndefinedConnections();
        
        // Filter out undefined participants and self
        const validParticipants = participants.filter(participant => {
          const isValid = participant && 
            participant.id && 
            participant.id !== user.id &&
            participant.id !== 'undefined' &&
            participant.id !== undefined;
          console.log(`🔍 Participant ${participant?.id} is valid: ${isValid}`);
          return isValid;
        });
        
        console.log('🔍 Periodic check: Valid participants:', validParticipants.map(p => p.id));
        console.log('🔍 Current peer connections:', Object.keys(peerConnectionsRef.current));
        
        validParticipants.forEach(participant => {
          if (!peerConnectionsRef.current[participant.id]) {
            console.log('🔗 Creating missing peer connection with participant:', participant.id);
            createPeerConnection(participant.id, true);
          }
        });
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [participants, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeWebRTC = async () => {
    console.log('🎬 Initializing WebRTC...');
    try {
      // Get user media
      console.log('📹 Getting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('✅ User media obtained:', stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join meeting room via socket
      console.log('🚪 Joining meeting room:', meetingId, 'User:', user.id, user.username);
      socket.joinMeeting(meetingId, user.id, user.username);

      // Set up socket listeners for WebRTC signaling
      setupSocketListeners();
      
      // Create peer connections with existing participants
      // This is important for when a user joins an existing meeting
      console.log('🔗 Creating peer connections with existing participants...');
      console.log('📊 Raw participants data:', participants);
      console.log('📊 Participants length:', participants?.length);
      
      if (participants && participants.length > 0) {
        // Filter out undefined participants and self
        const validParticipants = participants.filter(participant => {
          const isValid = participant && 
            participant.id && 
            participant.id !== user.id &&
            participant.id !== 'undefined';
          console.log(`Participant ${participant?.id} is valid: ${isValid}`);
          return isValid;
        });
        console.log('✅ Valid participants for peer connections:', validParticipants.map(p => p.id));
        
        validParticipants.forEach(participant => {
          console.log('🔗 Creating peer connection with existing participant:', participant.id);
          createPeerConnection(participant.id, true);
        });
      } else {
        console.log('⚠️ No participants found or participants array is empty');
      }

      setIsConnecting(false);
      console.log('✅ WebRTC initialization complete');
      
      // Immediate cleanup of any undefined connections
      setTimeout(() => {
        console.log('🧹 Immediate cleanup of undefined connections...');
        cleanupUndefinedConnections();
      }, 100);
      
      // Add a fallback mechanism to create peer connections with existing participants
      // This ensures we don't miss any connections due to timing issues
      setTimeout(() => {
        console.log('🔄 Fallback: Checking for missed peer connections...');
        if (participants && participants.length > 0) {
          // Filter out undefined participants and self
          const validParticipants = participants.filter(participant => 
            participant && 
            participant.id && 
            participant.id !== user.id
          );
          
          validParticipants.forEach(participant => {
            if (!peerConnectionsRef.current[participant.id]) {
              console.log('🔗 Creating missed peer connection with participant:', participant.id);
              createPeerConnection(participant.id, true);
            }
          });
        }
      }, 2000); // Wait 2 seconds for all user-joined events to be processed
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      setIsConnecting(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket.socket) {
      console.log('❌ No socket available for setting up listeners');
      return;
    }

    console.log('🔌 Setting up socket listeners...');

    // Remove existing listeners to prevent duplicates
    socket.socket.off('offer');
    socket.socket.off('answer');
    socket.socket.off('ice-candidate');
    socket.socket.off('user-joined');
    socket.socket.off('user-left');

    // Handle incoming offers
    socket.socket.on('offer', async (data) => {
      console.log('MeetingRoom received offer:', data);
      await handleIncomingOffer(data);
    });

    // Handle incoming answers
    socket.socket.on('answer', async (data) => {
      console.log('MeetingRoom received answer:', data);
      await handleIncomingAnswer(data);
    });

    // Handle incoming ICE candidates
    socket.socket.on('ice-candidate', async (data) => {
      console.log('MeetingRoom received ice-candidate:', data);
      await handleIncomingIceCandidate(data);
    });

    // Handle user joined
    socket.socket.on('user-joined', async (data) => {
      console.log('👥 User joined event received:', data);
      console.log('Current user ID:', user.id);
      console.log('Joined user ID:', data.userId);
      console.log('Current peer connections:', Object.keys(peerConnectionsRef.current));
      console.log('Current remote streams:', Object.keys(remoteStreams));
      
      if (data.userId !== user.id) {
        console.log('🔗 Creating peer connection for user:', data.userId);
        await createPeerConnection(data.userId, true); // Existing user creates connection to new user
        console.log('✅ Peer connection created for user:', data.userId);
        console.log('Updated peer connections:', Object.keys(peerConnectionsRef.current));
      } else {
        console.log('🚫 Ignoring self-join event');
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
    console.log(`Creating peer connection for user ${userId}, isInitiator: ${isInitiator}`);
    
    // Check if peer connection already exists
    if (peerConnectionsRef.current[userId]) {
      console.log(`Peer connection for user ${userId} already exists, skipping`);
      return;
    }
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream
    if (localStreamRef.current) {
      console.log('Adding local stream tracks to peer connection');
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('🎥 Received remote stream for user:', userId);
      console.log('Remote stream details:', event.streams[0]);
      console.log('Remote stream tracks:', event.streams[0].getTracks());
      const [remoteStream] = event.streams;
      remoteStreamsRef.current[userId] = remoteStream;
      
      // Force re-render by updating state with a new object
      setRemoteStreams(prev => {
        const newStreams = {
          ...prev,
          [userId]: remoteStream
        };
        console.log('📺 Updated remote streams:', Object.keys(newStreams));
        return newStreams;
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate for user:', userId);
        socket.sendIceCandidate(meetingId, event.candidate, userId);
      }
    };

    peerConnectionsRef.current[userId] = peerConnection;

    // Add connection state change listener
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for user ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log(`✅ Peer connection established with user ${userId}`);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for user ${userId}:`, peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'connected') {
        console.log(`✅ ICE connection established with user ${userId}`);
      }
    };

    if (isInitiator) {
      try {
        console.log('Creating offer for user:', userId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.sendOffer(meetingId, offer, userId);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  };

  const handleIncomingOffer = async (data) => {
    console.log('Received offer from user:', data.targetUserId || data.userId);
    const { offer, targetUserId, userId } = data;
    const actualUserId = targetUserId || userId;
    
    if (!peerConnectionsRef.current[actualUserId]) {
      console.log('Creating peer connection for incoming offer from user:', actualUserId);
      await createPeerConnection(actualUserId, false);
    }

    const peerConnection = peerConnectionsRef.current[actualUserId];
    
    try {
      console.log('Setting remote description and creating answer for user:', actualUserId);
      await peerConnection.setRemoteDescription(offer);
      
      // Process stored ICE candidates
      if (peerConnection.storedIceCandidates) {
        for (const candidate of peerConnection.storedIceCandidates) {
          await peerConnection.addIceCandidate(candidate);
        }
        peerConnection.storedIceCandidates = [];
      }
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.sendAnswer(meetingId, answer, actualUserId);
      console.log('Answer sent for user:', actualUserId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleIncomingAnswer = async (data) => {
    console.log('Received answer from user:', data.targetUserId || data.userId);
    const { answer, targetUserId, userId } = data;
    const actualUserId = targetUserId || userId;
    const peerConnection = peerConnectionsRef.current[actualUserId];
    
    if (peerConnection) {
      try {
        console.log('Setting remote description for answer from user:', actualUserId);
        await peerConnection.setRemoteDescription(answer);
        
        // Process stored ICE candidates
        if (peerConnection.storedIceCandidates) {
          for (const candidate of peerConnection.storedIceCandidates) {
            await peerConnection.addIceCandidate(candidate);
          }
          peerConnection.storedIceCandidates = [];
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIncomingIceCandidate = async (data) => {
    console.log('Received ICE candidate from user:', data.targetUserId || data.userId);
    const { candidate, targetUserId, userId } = data;
    const actualUserId = targetUserId || userId;
    const peerConnection = peerConnectionsRef.current[actualUserId];
    
    if (peerConnection && peerConnection.remoteDescription) {
      try {
        console.log('Adding ICE candidate for user:', actualUserId);
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    } else if (peerConnection) {
      console.log('Peer connection exists but not ready for ICE candidate, storing for later');
      // Store ICE candidate for later when remote description is set
      if (!peerConnection.storedIceCandidates) {
        peerConnection.storedIceCandidates = [];
      }
      peerConnection.storedIceCandidates.push(candidate);
    } else {
      console.log('No peer connection exists for user, creating one and storing ICE candidate');
      // Create peer connection and store ICE candidate
      await createPeerConnection(actualUserId, false);
      const newPeerConnection = peerConnectionsRef.current[actualUserId];
      if (newPeerConnection) {
        if (!newPeerConnection.storedIceCandidates) {
          newPeerConnection.storedIceCandidates = [];
        }
        newPeerConnection.storedIceCandidates.push(candidate);
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
    setRemoteStreams({});

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Leave socket room
    socket.leaveMeeting(meetingId);
  };

  // Cleanup undefined peer connections
  const cleanupUndefinedConnections = () => {
    const undefinedKeys = Object.keys(peerConnectionsRef.current).filter(key => 
      key === 'undefined' || key === undefined || !key
    );
    
    console.log('🧹 Found undefined keys to clean up:', undefinedKeys);
    
    undefinedKeys.forEach(key => {
      console.log('🧹 Cleaning up undefined peer connection:', key);
      if (peerConnectionsRef.current[key]) {
        peerConnectionsRef.current[key].close();
        delete peerConnectionsRef.current[key];
      }
      delete remoteStreamsRef.current[key];
    });
    
    if (undefinedKeys.length > 0) {
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        undefinedKeys.forEach(key => delete newStreams[key]);
        console.log('🧹 Cleaned up remote streams, new streams:', Object.keys(newStreams));
        return newStreams;
      });
    }
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
        {console.log('Rendering remote streams:', Object.keys(remoteStreams), 'Count:', Object.keys(remoteStreams).length)}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: (() => {
              const totalParticipants = Object.keys(remoteStreams).length + 1; // +1 for local video
              console.log('Total participants for grid:', totalParticipants);
              
              // Get screen width for responsive grid
              const screenWidth = window.innerWidth;
              console.log('Screen width:', screenWidth);
              
              // Auto-adjust grid based on number of participants and screen size
              if (totalParticipants <= 1) {
                return '1fr'; // Just local video
              } else if (totalParticipants <= 2) {
                return 'repeat(2, 1fr)'; // 2 columns
              } else if (totalParticipants <= 4) {
                // For laptop screens (1024px-1440px), use 2x2 grid
                if (screenWidth >= 1024 && screenWidth <= 1440) {
                  return 'repeat(2, 1fr)'; // 2x2 grid for laptop
                }
                return 'repeat(2, 1fr)'; // 2x2 grid
              } else if (totalParticipants <= 6) {
                // For laptop screens, use 2x3 grid
                if (screenWidth >= 1024 && screenWidth <= 1440) {
                  return 'repeat(2, 1fr)'; // 2 columns, 3 rows for laptop
                }
                return 'repeat(3, 1fr)'; // 3x2 grid
              } else if (totalParticipants <= 9) {
                // For laptop screens, use 3x3 grid
                if (screenWidth >= 1024 && screenWidth <= 1440) {
                  return 'repeat(3, 1fr)'; // 3x3 grid for laptop
                }
                return 'repeat(3, 1fr)'; // 3x3 grid
              } else {
                return 'repeat(4, 1fr)'; // 4 columns for more participants
              }
            })(),
            gap: 1,
            height: '100%',
            alignItems: 'stretch',
            maxHeight: 'calc(100vh - 200px)', // Ensure it fits on screen
            minHeight: '400px', // Minimum height for video grid
          }}
        >
          {/* Local Video */}
          <Box sx={{ 
            aspectRatio: '16/9', // Maintain video aspect ratio
            minHeight: '200px',
            maxHeight: '400px',
            display: 'flex',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: '#000'
          }}>
            <VideoPlayer
              stream={localStreamRef.current}
              isLocal={true}
              userName={user?.username}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
            />
          </Box>

          {/* Remote Videos */}
          {Object.keys(remoteStreams).length === 0 && (
            <Box
              sx={{
                background: '#333',
                borderRadius: 2,
                aspectRatio: '16/9',
                minHeight: '200px',
                maxHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                gridColumn: 'span 2', // Span across available columns
              }}
            >
              <Typography variant="body2">Waiting for other participants...</Typography>
            </Box>
          )}
          {Object.entries(remoteStreams)
            .filter(([userId]) => {
              const isValid = userId && 
                userId !== user.id && 
                userId !== 'undefined' && 
                userId !== undefined;
              console.log(`🎥 Video filter: userId ${userId} is valid: ${isValid}`);
              return isValid;
            })
            .map(([userId, stream]) => {
              console.log(`Rendering video for user ${userId}:`, stream);
              return (
                <Box 
                  key={userId} 
                  sx={{ 
                    aspectRatio: '16/9', // Maintain video aspect ratio
                    minHeight: '200px',
                    maxHeight: '400px',
                    display: 'flex',
                    borderRadius: 2,
                    overflow: 'hidden',
                    backgroundColor: '#000'
                  }}
                >
                  <VideoPlayer
                    stream={stream}
                    isLocal={false}
                    userName={`User ${userId}`}
                    isMuted={false}
                    isVideoOff={false}
                  />
                </Box>
              );
            })}
        </Box>
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
