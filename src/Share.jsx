import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';
import adapter from 'webrtc-adapter';

const socket = io('http://172.20.10.3:8000'); // Замените IP-адрес на адрес вашего сервера

function Share() {
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    async function startScreenShare() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.error('getDisplayMedia API is not supported in this browser');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // Можно включить, если хотите передавать системное аудио
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const peer = new RTCPeerConnection();

        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });

        // Отправка сигнала на сервер
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', {
              type: 'candidate',
              candidate: event.candidate,
            });
          }
        };

        // Создание предложения
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('signal', {
          type: 'offer',
          offer: peer.localDescription,
        });

        // Получение сигнала от сервера
        socket.on('signal', async (data) => {
          try {
            if (peer.signalingState === 'closed') return; // Проверка состояния подключения

            if (data.type === 'answer') {
              if (peer.signalingState === 'have-local-offer') {
                await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
              }
            } else if (data.type === 'candidate') {
              await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (error) {
            console.error('Error handling signal:', error);
          }
        });

        peerRef.current = peer;

        // Очистка при размонтировании компонента
        return () => {
          if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
          }
          console.log('Какая то очистка , можно подключаться')
        };
      } catch (err) {
        console.error('Error accessing display media:', err);
      }
    }

    startScreenShare();
  }, []);

  return (
    <div>
      <h2>Share Screen</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

export default Share;







