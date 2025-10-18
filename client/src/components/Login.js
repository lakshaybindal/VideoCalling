import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { loginUser, clearError } from '../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData));
      if (result.payload.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255,255,255,0.95)',
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#1976d2',
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to your account
              </Typography>
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

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="current-password"
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !formData.email || !formData.password}
                sx={{
                  py: 1.5,
                  mb: 3,
                  fontSize: '1.1rem',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    style={{
                      color: '#1976d2',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
