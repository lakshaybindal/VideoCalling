import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  MicOff,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';

const VideoPlayer = ({ stream, isLocal, userName, isMuted, isVideoOff }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isLocal]);

  return (
    <Box
      sx={{
        position: 'relative',
        background: '#000',
        borderRadius: 2,
        overflow: 'hidden',
        aspectRatio: '16/9',
        width: '100%',
        height: '100%',
        minHeight: 200,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent echo
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      
      {/* Video overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {userName} {isLocal && '(You)'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMuted && (
            <Chip
              icon={<MicOff />}
              label="Muted"
              size="small"
              sx={{
                bgcolor: 'rgba(244, 67, 54, 0.8)',
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          )}
          
          {isVideoOff && (
            <Chip
              icon={<VideocamOff />}
              label="Video Off"
              size="small"
              sx={{
                bgcolor: 'rgba(244, 67, 54, 0.8)',
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          )}
          
          {!isMuted && !isVideoOff && (
            <Chip
              icon={<Videocam />}
              label="Live"
              size="small"
              sx={{
                bgcolor: 'rgba(76, 175, 80, 0.8)',
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default VideoPlayer;
