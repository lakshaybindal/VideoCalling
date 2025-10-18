# WebRTC Camera Preview Fixes

## Summary of Changes to Fix Camera Preview and Video Streaming

### 1. **Removed Conflicting WebRTC Event Handlers from SocketContext**
**File changed:** `client/src/context/SocketContext.js`

**Problem:** WebRTC signaling events were being handled in SocketContext but not properly forwarded, causing signaling failures.

**Solution:** Removed WebRTC event listeners from SocketContext and let MeetingRoom handle them directly.

**Changes:**
```javascript
// REMOVED these event listeners from SocketContext:
// socket.on('offer', ...)
// socket.on('answer', ...) 
// socket.on('ice-candidate', ...)

// KEPT only the debugging methods:
const sendOffer = (meetingId, offer, targetUserId) => {
  if (socket) {
    console.log('Sending offer to server:', { meetingId, offer, targetUserId });
    socket.emit('offer', { meetingId, offer, targetUserId });
  }
};
```

### 2. **Fixed WebRTC Signaling Data Structure**
**File changed:** `client/src/components/MeetingRoom.js`

**Problem:** Server sends `targetUserId` but client was looking for `userId`, causing undefined user IDs and failed peer connections.

**Solution:** Updated all WebRTC event handlers to handle both `targetUserId` and `userId` fields.

**Changes:**
```javascript
// In handleIncomingOffer, handleIncomingAnswer, handleIncomingIceCandidate:
const { offer, targetUserId, userId } = data;
const actualUserId = targetUserId || userId;
```

### 3. **Fixed Duplicate Event Listeners**
**File changed:** `client/src/components/MeetingRoom.js`

**Problem:** Event listeners were being added multiple times, causing infinite loops of ICE candidates.

**Solution:** Added `socket.socket.off()` calls to remove existing listeners before adding new ones.

**Changes:**
```javascript
const setupSocketListeners = () => {
  if (!socket?.socket) return;
  
  // Remove existing listeners to prevent duplicates
  socket.socket.off('offer');
  socket.socket.off('answer');
  socket.socket.off('ice-candidate');
  
  // Add new listeners
  socket.socket.on('offer', handleIncomingOffer);
  socket.socket.on('answer', handleIncomingAnswer);
  socket.socket.on('ice-candidate', handleIncomingIceCandidate);
};
```

### 4. **Fixed Peer Connection Creation Logic**
**File changed:** `client/src/components/MeetingRoom.js`

**Problem:** Multiple peer connections were being created for the same user, causing conflicts.

**Solution:** Added check to prevent duplicate peer connections.

**Changes:**
```javascript
const createPeerConnection = async (userId, isInitiator) => {
  // Check if peer connection already exists
  if (peerConnectionsRef.current[userId]) {
    console.log('Peer connection already exists for user:', userId);
    return peerConnectionsRef.current[userId];
  }
  
  // ... rest of peer connection creation logic
};
```

### 5. **Fixed ICE Candidate Handling**
**File changed:** `client/src/components/MeetingRoom.js`

**Problem:** ICE candidates were being received before peer connections were ready, causing the "undefined is not an object" error.

**Solution:** Added logic to store ICE candidates when peer connections aren't ready and process them later.

**Changes:**
```javascript
const handleIncomingIceCandidate = async (data) => {
  const { candidate, targetUserId, userId } = data;
  const actualUserId = targetUserId || userId;
  const peerConnection = peerConnectionsRef.current[actualUserId];
  
  if (peerConnection && peerConnection.remoteDescription) {
    // Add ICE candidate immediately
    await peerConnection.addIceCandidate(candidate);
  } else if (peerConnection) {
    // Store ICE candidate for later
    if (!peerConnection.storedIceCandidates) {
      peerConnection.storedIceCandidates = [];
    }
    peerConnection.storedIceCandidates.push(candidate);
  } else {
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
```

### 6. **Added Comprehensive Debugging**
**Files changed:** `client/src/components/MeetingRoom.js`, `server/index.js`

**Problem:** Hard to debug WebRTC issues without proper logging.

**Solution:** Added extensive console.log statements throughout the WebRTC flow.

**Key debugging added:**
- WebRTC signaling flow (offers, answers, ICE candidates)
- Peer connection state changes
- Remote stream reception
- User ID tracking
- ICE candidate storage and processing

### 7. **Fixed Remote Stream Rendering**
**File changed:** `client/src/components/MeetingRoom.js`

**Problem:** Remote streams weren't being displayed even when received.

**Solution:** Added `remoteStreams` state to force re-renders and improved video rendering logic.

**Changes:**
```javascript
const [remoteStreams, setRemoteStreams] = useState({});

// In peer connection ontrack event:
const handleRemoteStream = (stream, userId) => {
  console.log('Received remote stream from user:', userId);
  setRemoteStreams(prev => ({
    ...prev,
    [userId]: stream
  }));
};
```

## Instructions for Implementation

To apply these same fixes:

1. **Remove WebRTC event handlers** from SocketContext (keep only the send methods)
2. **Add duplicate listener prevention** in MeetingRoom setupSocketListeners
3. **Fix WebRTC data structure** to handle both targetUserId and userId
4. **Add peer connection existence checks** to prevent duplicates
5. **Implement ICE candidate storage** for when peer connections aren't ready
6. **Add comprehensive debugging** throughout the WebRTC flow
7. **Add remoteStreams state** for proper video rendering

## Key Insight

The main issue was that the server was sending `targetUserId` but the client was expecting `userId`, causing all WebRTC signaling to fail silently. Once that was fixed, the video streams started working properly!

## Files Modified

- `client/src/context/SocketContext.js`
- `client/src/components/MeetingRoom.js`
- `server/index.js`
