import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './VideoChat.css';

const socket = io('http://localhost:5000'); // Backend server URL
const ROOM = 'live-room';

const VideoChat = ({ role }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const [noHost, setNoHost] = useState(false);

  useEffect(() => {
    if (role === 'host') {
      hostJoin();
    } else {
      viewerJoin();
    }
  }, []);

  const hostJoin = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    localRef.current.srcObject = stream;

    socket.emit('host-join', ROOM);

    socket.on('viewer-joined', async viewerId => {
      const peer = createPeerConnection(viewerId);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('offer', { to: viewerId, offer });
      peerRef.current = peer;
    });

    socket.on('answer', ({ answer }) => {
      peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (candidate) {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  };

  const viewerJoin = () => {
    socket.emit('viewer-join', ROOM);

    socket.on('no-host', () => {
      setNoHost(true);
    });

    socket.on('host-available', async (hostId) => {
      setNoHost(false);
      const peer = createPeerConnection(hostId);

      peer.ontrack = event => {
        remoteRef.current.srcObject = event.streams[0];
      };

      socket.on('offer', async ({ offer }) => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { to: hostId, answer });
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      peerRef.current = peer;
    });
  };

  const createPeerConnection = (id) => {
    const pc = new RTCPeerConnection();
    pc.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: id, candidate: event.candidate });
      }
    };
    return pc;
  };

  return (
    <div className="video-container">
      <h2 className="role-label">{role === 'host' ? 'You are Hosting' : 'You are Viewing'}</h2>

      {noHost && <p className="no-host-msg">🚫 No host is currently live. Please wait or try again later.</p>}

      <div className="video-box">
        {role === 'host' && (
          <video ref={localRef} autoPlay muted playsInline className="video" />
        )}
        {role === 'viewer' && !noHost && (
          <video ref={remoteRef} autoPlay playsInline className="video" />
        )}
      </div>
    </div>
  );
};

export default VideoChat;
