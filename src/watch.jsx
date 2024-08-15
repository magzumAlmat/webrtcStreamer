import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('http://172.20.10.3:8000'); // Замените на IP вашего сервера

function Watch() {
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    const peer = new Peer({
      initiator: false, // Клиент не является инициатором соединения
      trickle: false,
    });

    peer.on('signal', (data) => {
      socket.emit('signal', data);
    });

    socket.on('signal', (data) => {
      peer.signal(data);
    });

    peer.on('stream', (stream) => {
      videoRef.current.srcObject = stream;
    });

    peerRef.current = peer;
  }, []);

  return (
    <div>
      <h2>Watch Stream</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

export default Watch;