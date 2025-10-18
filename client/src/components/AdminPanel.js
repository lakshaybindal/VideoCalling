import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
} from '@mui/material';
import {
  Close,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';
import { updateAdminControls } from '../store/slices/meetingSlice';

const AdminPanel = ({ meetingId, participants, onClose }) => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { currentMeeting } = useSelector(state => state.meeting);
  const { user } = useSelector(state => state.auth);
  
  const [adminControls, setAdminControls] = useState(
    currentMeeting?.adminControls || {
      allowScreenShare: true,
      allowChat: true,
      allowVideoToggle: true,
      allowAudioToggle: true,
    }
  );
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState(null);

  const handleControlChange = (control, value) => {
    const newControls = { ...adminControls, [control]: value };
    setAdminControls(newControls);
    
    // Update on server
    dispatch(updateAdminControls({ meetingId, controls: newControls }));
  };

  const handleUserAction = (userId, action) => {
    setActionToConfirm({ userId, action });
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (!actionToConfirm) return;
    
    const { userId, action } = actionToConfirm;
    
    switch (action) {
      case 'mute':
        socket.adminMuteUser(meetingId, userId, true);
        break;
      case 'unmute':
        socket.adminMuteUser(meetingId, userId, false);
        break;
      case 'videoOff':
        socket.adminToggleUserVideo(meetingId, userId, true);
        break;
      case 'videoOn':
        socket.adminToggleUserVideo(meetingId, userId, false);
        break;
      default:
        break;
    }
    
    setShowConfirmDialog(false);
    setActionToConfirm(null);
  };

  const getParticipantName = (participant) => {
    return participant.user?.username || `User ${participant.user?._id}`;
  };

  const isCurrentUser = (participant) => {
    return participant.user?._id === user?.id;
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 20,
        top: 80,
        width: 400,
        maxHeight: 600,
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
        <Typography variant="h6">Admin Controls</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, maxHeight: 500, overflow: 'auto' }}>
        {/* Meeting Controls */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Meeting Settings
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={adminControls.allowScreenShare}
                onChange={(e) => handleControlChange('allowScreenShare', e.target.checked)}
              />
            }
            label="Allow Screen Sharing"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={adminControls.allowChat}
                onChange={(e) => handleControlChange('allowChat', e.target.checked)}
              />
            }
            label="Allow Chat"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={adminControls.allowVideoToggle}
                onChange={(e) => handleControlChange('allowVideoToggle', e.target.checked)}
              />
            }
            label="Allow Video Toggle"
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={adminControls.allowAudioToggle}
                onChange={(e) => handleControlChange('allowAudioToggle', e.target.checked)}
              />
            }
            label="Allow Audio Toggle"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Participants */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Participants ({participants.length})
        </Typography>
        
        <List dense>
          {participants.map((participant, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {getParticipantName(participant)}
                    </Typography>
                    {isCurrentUser(participant) && (
                      <Chip label="You" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Joined: {new Date(participant.joinedAt).toLocaleTimeString()}
                  </Typography>
                }
              />
              
              {!isCurrentUser(participant) && (
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(participant.user._id, 'mute')}
                      title="Mute User"
                    >
                      <MicOff fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(participant.user._id, 'unmute')}
                      title="Unmute User"
                    >
                      <Mic fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(participant.user._id, 'videoOff')}
                      title="Turn Off Video"
                    >
                      <VideocamOff fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(participant.user._id, 'videoOn')}
                      title="Turn On Video"
                    >
                      <Videocam fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionToConfirm?.action} this participant?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmAction} color="primary" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminPanel;
