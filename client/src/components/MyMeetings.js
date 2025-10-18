import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  VideoCall,
  Schedule,
  Delete,
  Share,
  Lock,
} from '@mui/icons-material';
import { getMyMeetings, createMeeting, endMeeting } from '../store/slices/meetingSlice';
import { clearError } from '../store/slices/meetingSlice';

const MyMeetings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myMeetings, loading, error } = useSelector(state => state.meeting);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [meetingToEnd, setMeetingToEnd] = useState(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    password: '',
    isScheduled: false,
    scheduledDate: '',
  });

  useEffect(() => {
    dispatch(getMyMeetings());
  }, [dispatch]);

  const handleCreateMeeting = async () => {
    if (!createForm.title.trim()) return;

    const meetingData = {
      title: createForm.title,
      description: createForm.description,
      password: createForm.password || null,
      isScheduled: createForm.isScheduled,
      scheduledDate: createForm.isScheduled ? createForm.scheduledDate : null,
    };

    try {
      const result = await dispatch(createMeeting(meetingData));
      if (result.payload.success) {
        setShowCreateDialog(false);
        setCreateForm({
          title: '',
          description: '',
          password: '',
          isScheduled: false,
          scheduledDate: '',
        });
        dispatch(getMyMeetings()); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleJoinMeeting = (meetingId) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleEndMeeting = (meeting) => {
    setMeetingToEnd(meeting);
    setShowEndDialog(true);
  };

  const confirmEndMeeting = async () => {
    if (meetingToEnd) {
      try {
        await dispatch(endMeeting(meetingToEnd.meetingId));
        setShowEndDialog(false);
        setMeetingToEnd(null);
        dispatch(getMyMeetings()); // Refresh the list
      } catch (error) {
        console.error('Error ending meeting:', error);
      }
    }
  };

  const copyMeetingLink = (meetingId) => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isMeetingActive = (meeting) => {
    if (meeting.status === 'ended') return false;
    if (meeting.isScheduled) {
      return new Date() >= new Date(meeting.scheduledDate);
    }
    return true;
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
              My Meetings
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Manage your video meetings
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateDialog(true)}
            sx={{
              bgcolor: 'white',
              color: '#1976d2',
              px: 3,
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Create Meeting
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {myMeetings.length === 0 ? (
              <Grid item xs={12}>
                <Card sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No meetings yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create your first meeting to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Create Meeting
                  </Button>
                </Card>
              </Grid>
            ) : (
              myMeetings.map((meeting) => (
                <Grid item xs={12} sm={6} md={4} key={meeting.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                          {meeting.title}
                        </Typography>
                        <Chip
                          label={meeting.status}
                          color={getStatusColor(meeting.status)}
                          size="small"
                        />
                      </Box>

                      {meeting.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {meeting.description}
                        </Typography>
                      )}

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Meeting ID: {meeting.meetingId}
                        </Typography>
                        {meeting.password && (
                          <Chip
                            icon={<Lock />}
                            label="Password Protected"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>

                      {meeting.isScheduled && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Scheduled: {formatDate(meeting.scheduledDate)}
                        </Typography>
                      )}

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Participants: {meeting.participants}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(meeting.createdAt)}
                      </Typography>

                      <Box sx={{ mt: 'auto', pt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {isMeetingActive(meeting) && (
                          <Button
                            variant="contained"
                            startIcon={<VideoCall />}
                            onClick={() => handleJoinMeeting(meeting.meetingId)}
                            size="small"
                            fullWidth
                          >
                            {meeting.status === 'active' ? 'Join' : 'Start'}
                          </Button>
                        )}
                        
                        <IconButton
                          onClick={() => copyMeetingLink(meeting.meetingId)}
                          title="Copy meeting link"
                          size="small"
                        >
                          <Share />
                        </IconButton>
                        
                        {meeting.status === 'active' && (
                          <IconButton
                            onClick={() => handleEndMeeting(meeting)}
                            title="End meeting"
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Container>

      {/* Create Meeting Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Meeting</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Meeting Title"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Description (optional)"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          
          <TextField
            fullWidth
            label="Password (optional)"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            margin="normal"
            placeholder="Leave empty for no password"
          />
          
          <Box sx={{ mt: 2 }}>
            <label>
              <input
                type="checkbox"
                checked={createForm.isScheduled}
                onChange={(e) => setCreateForm({ ...createForm, isScheduled: e.target.checked })}
              />
              Schedule for later
            </label>
          </Box>
          
          {createForm.isScheduled && (
            <TextField
              fullWidth
              type="datetime-local"
              value={createForm.scheduledDate}
              onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateMeeting}
            variant="contained"
            disabled={!createForm.title.trim()}
          >
            Create Meeting
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Meeting Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Meeting</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end "{meetingToEnd?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
          <Button onClick={confirmEndMeeting} color="error" variant="contained">
            End Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyMeetings;
