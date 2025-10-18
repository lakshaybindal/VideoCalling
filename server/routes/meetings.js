const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new meeting
router.post('/create', auth, async (req, res) => {
  try {
    const { title, description, password, isScheduled, scheduledDate } = req.body;
    
    const meetingId = uuidv4().substring(0, 8);
    
    const meeting = new Meeting({
      meetingId,
      title,
      description,
      creator: req.user.id,
      password,
      isScheduled,
      scheduledDate: isScheduled ? new Date(scheduledDate) : null,
      status: isScheduled ? 'scheduled' : 'active',
      participants: [{
        user: req.user.id,
        joinedAt: new Date(),
        isActive: true
      }]
    });

    await meeting.save();
    
    // Add meeting to user's meetings
    await User.findByIdAndUpdate(req.user.id, {
      $push: { meetings: meeting._id }
    });

    // Populate the meeting with user data
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('creator', 'username email')
      .populate('participants.user', 'username email');

    // Transform participants to match client expectations
    const transformedParticipants = populatedMeeting.participants
      .filter(participant => participant.user) // Filter out participants with missing user data
      .map(participant => ({
        userId: participant.user._id,
        userName: participant.user.username,
        joinedAt: participant.joinedAt,
        isActive: participant.isActive
      }));

    res.json({
      success: true,
      meeting: {
        id: populatedMeeting._id,
        meetingId: populatedMeeting.meetingId,
        title: populatedMeeting.title,
        description: populatedMeeting.description,
        password: populatedMeeting.password,
        isScheduled: populatedMeeting.isScheduled,
        scheduledDate: populatedMeeting.scheduledDate,
        status: populatedMeeting.status,
        creator: populatedMeeting.creator,
        participants: transformedParticipants
      }
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to create meeting' });
  }
});

// Join a meeting
router.post('/join', auth, async (req, res) => {
  try {
    const { meetingId, password } = req.body;
    
    const meeting = await Meeting.findOne({ meetingId })
      .populate('creator', 'username email')
      .populate('participants.user', 'username email');
    
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Check if meeting is scheduled and not yet started
    if (meeting.isScheduled && meeting.status === 'scheduled') {
      const now = new Date();
      if (now < meeting.scheduledDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Meeting has not started yet',
          scheduledDate: meeting.scheduledDate
        });
      }
    }

    // Check password if required
    if (meeting.password && meeting.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Add user to participants if not already present
    const existingParticipant = meeting.participants.find(
      p => p.user.toString() === req.user.id
    );

    if (!existingParticipant) {
      meeting.participants.push({
        user: req.user.id,
        joinedAt: new Date(),
        isActive: true
      });
      await meeting.save();
    }

    // Transform participants to match client expectations
    const transformedParticipants = meeting.participants
      .filter(participant => participant.user) // Filter out participants with missing user data
      .map(participant => ({
        userId: participant.user._id,
        userName: participant.user.username,
        joinedAt: participant.joinedAt,
        isActive: participant.isActive
      }));

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        meetingId: meeting.meetingId,
        title: meeting.title,
        description: meeting.description,
        creator: meeting.creator,
        participants: transformedParticipants,
        adminControls: meeting.adminControls,
        status: meeting.status
      }
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to join meeting' });
  }
});

// Get user's meetings
router.get('/my-meetings', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ creator: req.user.id })
      .populate('participants.user', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      meetings: meetings.map(meeting => ({
        id: meeting._id,
        meetingId: meeting.meetingId,
        title: meeting.title,
        description: meeting.description,
        isScheduled: meeting.isScheduled,
        scheduledDate: meeting.scheduledDate,
        status: meeting.status,
        participants: meeting.participants.length,
        createdAt: meeting.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
});

// Get meeting details
router.get('/:meetingId', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId })
      .populate('creator', 'username email')
      .populate('participants.user', 'username email');

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Transform participants to match client expectations
    const transformedParticipants = meeting.participants
      .filter(participant => participant.user) // Filter out participants with missing user data
      .map(participant => ({
        userId: participant.user._id,
        userName: participant.user.username,
        joinedAt: participant.joinedAt,
        isActive: participant.isActive
      }));

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        meetingId: meeting.meetingId,
        title: meeting.title,
        description: meeting.description,
        creator: meeting.creator,
        participants: transformedParticipants,
        adminControls: meeting.adminControls,
        status: meeting.status,
        isScheduled: meeting.isScheduled,
        scheduledDate: meeting.scheduledDate
      }
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meeting' });
  }
});

// Update admin controls
router.put('/:meetingId/admin-controls', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ 
      meetingId: req.params.meetingId,
      creator: req.user.id 
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or unauthorized' });
    }

    const { allowScreenShare, allowChat, allowVideoToggle, allowAudioToggle } = req.body;
    
    meeting.adminControls = {
      allowScreenShare: allowScreenShare !== undefined ? allowScreenShare : meeting.adminControls.allowScreenShare,
      allowChat: allowChat !== undefined ? allowChat : meeting.adminControls.allowChat,
      allowVideoToggle: allowVideoToggle !== undefined ? allowVideoToggle : meeting.adminControls.allowVideoToggle,
      allowAudioToggle: allowAudioToggle !== undefined ? allowAudioToggle : meeting.adminControls.allowAudioToggle
    };

    await meeting.save();

    res.json({
      success: true,
      adminControls: meeting.adminControls
    });
  } catch (error) {
    console.error('Error updating admin controls:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin controls' });
  }
});

// End meeting
router.put('/:meetingId/end', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ 
      meetingId: req.params.meetingId,
      creator: req.user.id 
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or unauthorized' });
    }

    meeting.status = 'ended';
    await meeting.save();

    res.json({
      success: true,
      message: 'Meeting ended successfully'
    });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ success: false, message: 'Failed to end meeting' });
  }
});

module.exports = router;
