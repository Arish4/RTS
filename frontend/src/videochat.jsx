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
  const [pendingOffer, setPendingOffer] = useState(null); // ✅ store offer if hostId isn't ready

  useEffect(() => {
    if (role === 'host') {
      hostJoin();
    } else {
      viewerJoin();
    }

    socket.on('ice-candidate', async ({ candidate }) => {
      if (candidate) {
        await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('offer', async ({ offer, from }) => {
      if (role === 'viewer') {
        if (hostId) {
          await handleOffer(offer, from);
        } else {
          setPendingOffer({ offer, from }); // ✅ Save until hostId is available
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (pendingOffer && hostId) {
      handleOffer(pendingOffer.offer, pendingOffer.from);
      setPendingOffer(null);
    }
  }, [hostId, pendingOffer]);

  const hostJoin = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = stream;
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
  };

  const viewerJoin = () => {
    socket.emit('viewer-join', ROOM);

    socket.on('no-host', () => {
      setNoHost(true);
    });

    socket.on('host-available', hostSocketId => {
      setNoHost(false);
      setHostId(hostSocketId);
    });
  };

  const handleOffer = async (offer, from) => {
    const peer = createPeerConnection(from);
    peer.ontrack = e => {
      remoteRef.current.srcObject = e.streams[0];
    };
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('answer', { to: from, answer });
    peerRef.current = peer;
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

      {noHost && <p className="no-host-msg">🚫 No host is currently live.</p>}

      <div className="video-box">
        {role === 'host' && <video ref={localRef} autoPlay muted playsInline className="video" />}
        {role === 'viewer' && !noHost && <video ref={remoteRef} autoPlay playsInline className="video" />}
      </div>
    </div>
  );
};

export default VideoChat;
