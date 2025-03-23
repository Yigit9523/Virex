import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import io from 'socket.io-client';
import 'webrtc-adapter';

const configuration = {
  iceServers: [
    // Google's free STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // OpenRelay's free TURN servers
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
};

const VideoScreen = ({ route, navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const cameraRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  
  const { roomId, userId } = route.params;

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
      
      if (cameraStatus === 'granted' && audioStatus === 'granted') {
        setupWebRTC();
      }
    })();

    return () => {
      cleanupWebRTC();
    };
  }, []);

  const setupWebRTC = async () => {
    // Connect to signaling server
    socketRef.current = io('http://localhost:5000');
    
    // Join room
    socketRef.current.emit('joinRoom', roomId, userId);

    // Handle new user joined
    socketRef.current.on('userJoined', async ({ userId, socketId }) => {
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionsRef.current[socketId] = peerConnection;

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current.emit('offer', {
        target: socketId,
        sdp: offer,
      });

      setupPeerConnectionHandlers(peerConnection, socketId);
    });

    // Handle received offer
    socketRef.current.on('offer', async ({ sdp, caller }) => {
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionsRef.current[caller] = peerConnection;

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      // Set remote description and create answer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketRef.current.emit('answer', {
        target: caller,
        sdp: answer,
      });

      setupPeerConnectionHandlers(peerConnection, caller);
    });

    // Handle received answer
    socketRef.current.on('answer', async ({ sdp, answerer }) => {
      const peerConnection = peerConnectionsRef.current[answerer];
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // Handle ICE candidate
    socketRef.current.on('iceCandidate', async ({ candidate, from }) => {
      const peerConnection = peerConnectionsRef.current[from];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Handle user left
    socketRef.current.on('userLeft', (socketId) => {
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
    });
  };

  const setupPeerConnectionHandlers = (peerConnection, socketId) => {
    // Handle ICE candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('iceCandidate', {
          target: socketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      // Handle remote video stream
      // You'll need to implement a way to display this stream in your UI
    };
  };

  const cleanupWebRTC = () => {
    if (socketRef.current) {
      socketRef.current.emit('leaveRoom', roomId);
      socketRef.current.disconnect();
    }

    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      socketRef.current.emit('mediaStateChange', {
        roomId,
        type: 'audio',
        enabled: !isMuted,
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      socketRef.current.emit('mediaStateChange', {
        roomId,
        type: 'video',
        enabled: !isVideoEnabled,
      });
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleAudio}>
            <MaterialIcons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleVideo}>
            <MaterialIcons
              name={isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleCamera}>
            <MaterialIcons name="flip-camera-ios" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.endCall]}
            onPress={() => {
              cleanupWebRTC();
              navigation.goBack();
            }}
          >
            <MaterialIcons name="call-end" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 30,
    marginHorizontal: 10,
  },
  endCall: {
    backgroundColor: '#FF4444',
  },
});

export default VideoScreen;
