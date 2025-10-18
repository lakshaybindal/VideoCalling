const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDate: {
    type: Date
  },
  password: {
    type: String,
    default: null
  },
  isRecording: {
    type: Boolean,
    default: false
  },
  adminControls: {
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    allowVideoToggle: {
      type: Boolean,
      default: true
    },
    allowAudioToggle: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'scheduled'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
