import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Async thunks
export const createMeeting = createAsyncThunk(
  'meeting/createMeeting',
  async (meetingData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/meetings/create`, meetingData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create meeting');
    }
  }
);

export const joinMeeting = createAsyncThunk(
  'meeting/joinMeeting',
  async ({ meetingId, password }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/meetings/join`, {
        meetingId,
        password,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join meeting');
    }
  }
);

export const getMyMeetings = createAsyncThunk(
  'meeting/getMyMeetings',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/meetings/my-meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meetings');
    }
  }
);

export const getMeetingDetails = createAsyncThunk(
  'meeting/getMeetingDetails',
  async (meetingId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meeting details');
    }
  }
);

export const updateAdminControls = createAsyncThunk(
  'meeting/updateAdminControls',
  async ({ meetingId, controls }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/meetings/${meetingId}/admin-controls`, controls, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update admin controls');
    }
  }
);

export const endMeeting = createAsyncThunk(
  'meeting/endMeeting',
  async (meetingId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/meetings/${meetingId}/end`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end meeting');
    }
  }
);

const meetingSlice = createSlice({
  name: 'meeting',
  initialState: {
    currentMeeting: null,
    myMeetings: [],
    participants: [],
    messages: [],
    isInMeeting: false,
    isScreenSharing: false,
    isMuted: false,
    isVideoOff: false,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
      state.isInMeeting = true;
    },
    addParticipant: (state, action) => {
      const participant = action.payload;
      const existingIndex = state.participants.findIndex(p => p.userId === participant.userId);
      if (existingIndex === -1) {
        state.participants.push(participant);
      }
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(p => p.userId !== action.payload);
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setScreenSharing: (state, action) => {
      state.isScreenSharing = action.payload;
    },
    setMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    setVideoOff: (state, action) => {
      state.isVideoOff = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    leaveMeeting: (state) => {
      state.currentMeeting = null;
      state.participants = [];
      state.messages = [];
      state.isInMeeting = false;
      state.isScreenSharing = false;
      state.isMuted = false;
      state.isVideoOff = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create meeting
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload.meeting;
        state.isInMeeting = true;
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Join meeting
      .addCase(joinMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload.meeting;
        state.participants = action.payload.meeting.participants || [];
        state.isInMeeting = true;
      })
      .addCase(joinMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get my meetings
      .addCase(getMyMeetings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.myMeetings = action.payload.meetings;
      })
      .addCase(getMyMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get meeting details
      .addCase(getMeetingDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMeetingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeeting = action.payload.meeting;
        state.participants = action.payload.meeting.participants || [];
      })
      .addCase(getMeetingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update admin controls
      .addCase(updateAdminControls.fulfilled, (state, action) => {
        if (state.currentMeeting) {
          state.currentMeeting.adminControls = action.payload.adminControls;
        }
      })
      // End meeting
      .addCase(endMeeting.fulfilled, (state) => {
        state.currentMeeting = null;
        state.participants = [];
        state.messages = [];
        state.isInMeeting = false;
        state.isScreenSharing = false;
        state.isMuted = false;
        state.isVideoOff = false;
      });
  },
});

export const {
  setCurrentMeeting,
  addParticipant,
  removeParticipant,
  addMessage,
  setScreenSharing,
  setMuted,
  setVideoOff,
  clearMessages,
  leaveMeeting,
  clearError,
} = meetingSlice.actions;

export default meetingSlice.reducer;
