import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import {
  VideoCall,
  GroupAdd,
  Schedule,
  Security,
  Chat,
  ScreenShare,
} from '@mui/icons-material';
import { createMeeting, joinMeeting } from '../store/slices/meetingSlice';
import { clearError } from '../store/slices/meetingSlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { loading, error } = useSelector(state => state.meeting);
  
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateMeeting = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const meetingData = {
      title: `Meeting with ${user.username}`,
      description: 'Quick video call',
    };

    try {
      const result = await dispatch(createMeeting(meetingData));
      if (result.payload.success) {
        navigate(`/meeting/${result.payload.meeting.meetingId}`);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleJoinMeeting = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!meetingId.trim()) {
      return;
    }

    try {
      const result = await dispatch(joinMeeting({ meetingId, password }));
      if (result.payload.success) {
        navigate(`/meeting/${meetingId}`);
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  };

  const handleQuickJoin = () => {
    setShowJoinForm(true);
  };

  const features = [
    {
      icon: <VideoCall sx={{ fontSize: 40 }} />,
      title: 'HD Video Calls',
      description: 'Crystal clear video quality with WebRTC technology',
    },
    {
      icon: <Chat sx={{ fontSize: 40 }} />,
      title: 'Real-time Chat',
      description: 'Send messages during your video calls',
    },
    {
      icon: <ScreenShare sx={{ fontSize: 40 }} />,
      title: 'Screen Sharing',
      description: 'Share your screen with all participants',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure Meetings',
      description: 'Password-protected meetings for privacy',
    },
    {
      icon: <Schedule sx={{ fontSize: 40 }} />,
      title: 'Scheduled Meetings',
      description: 'Plan and schedule future meetings',
    },
    {
      icon: <GroupAdd sx={{ fontSize: 40 }} />,
      title: 'Multiple Participants',
      description: 'Support for multiple users in one call',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              mb: 2,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            VideoCall Pro
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Connect with anyone, anywhere. High-quality video calls with advanced features.
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateMeeting}
              disabled={loading}
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              {loading ? 'Creating...' : 'Start New Meeting'}
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={handleQuickJoin}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Join Meeting
            </Button>
          </Box>

          {!isAuthenticated && (
            <Box sx={{ mt: 4 }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ color: 'white', mr: 2 }}
              >
                Login
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/register')}
                sx={{ color: 'white' }}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>

        {/* Join Meeting Form */}
        {showJoinForm && (
          <Card sx={{ maxWidth: 500, mx: 'auto', mb: 6 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Join a Meeting
              </Typography>
              <Box component="form" sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Meeting ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Enter meeting ID"
                />
                <TextField
                  fullWidth
                  label="Password (optional)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 3 }}
                  placeholder="Enter password if required"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleJoinMeeting}
                    disabled={loading || !meetingId.trim()}
                    fullWidth
                  >
                    {loading ? 'Joining...' : 'Join Meeting'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowJoinForm(false)}
                    fullWidth
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              color: 'white',
              textAlign: 'center',
              mb: 6,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Powerful Features
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <Box sx={{ color: 'white', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* User Dashboard Link */}
        {isAuthenticated && (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/my-meetings')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              My Meetings
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Home;
