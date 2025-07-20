import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './VideoChat.css';

const socket = io('https://rts-mgcs.onrender.com');
const ROOM = 'live-room';

const VideoChat = ({ role }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const localStream = useRef(null);
  const peerRef = useRef(null);
  const [noHost, setNoHost] = useState(false);
  const [hostId, setHostId] = useState(null);

  useEffect(() => {
    if (role === 'host') {
      hostJoin();
    } else {
      viewerJoin();
    }

    socket.on('ice-candidate', async ({ candidate }) => {
      if (candidate && peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ ICE candidate added");
        } catch (e) {
          console.error("❌ ICE candidate error", e);
        }
      }
    });

    socket.on('offer', async ({ offer }) => {
      if (role === 'viewer' && hostId) {
        const peer = createPeerConnection(hostId);
        
        peer.ontrack = (event) => {
          console.log("🎥 ontrack event received");
          if (event.streams && event.streams[0]) {
            remoteRef.current.srcObject = event.streams[0];
          } else if (event.track) {
            const stream = new MediaStream([event.track]);
            remoteRef.current.srcObject = stream;
          }
        };

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit('answer', { to: hostId, answer });
        peerRef.current = peer;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [hostId]);

  const hostJoin = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
      }

      socket.emit('host-join', ROOM);

      socket.on('viewer-joined', async (viewerId) => {
        console.log(`🟢 Host: viewer ${viewerId} joined`);

        const peer = createPeerConnection(viewerId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit('offer', { to: viewerId, offer });
        peerRef.current = peer;
      });

      socket.on('answer', ({ answer }) => {
        if (peerRef.current) {
          peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });
    } catch (err) {
      console.error("❌ Error in hostJoin:", err);
    }
  };

  const viewerJoin = () => {
    socket.emit('viewer-join', ROOM);

    socket.on('no-host', () => {
      setNoHost(true);
    });

    socket.on('host-available', (hostSocketId) => {
      setNoHost(false);
      setHostId(hostSocketId);
    });
  };

  const createPeerConnection = (id) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: id, candidate: event.candidate });
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("📡 ICE State:", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'disconnected') {
        console.warn("⚠️ ICE disconnected — maybe restart needed");
      }
    };

    return peerConnection;
  };

  return (
    <div className="video-container">
      <h2>{role === 'host' ? 'You are Hosting' : 'You are Viewing'}</h2>
      {noHost && <p>No Host is live</p>}

      <div className="video-box">
        {role === 'host' && <video ref={localRef} autoPlay muted playsInline className="video" />}
        {role === 'viewer' && !noHost && <video ref={remoteRef} autoPlay playsInline className="video" />}
      </div>
    </div>
  );
};

export default VideoChat;
