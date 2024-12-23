import React, { useEffect, useRef, useState } from 'react';

const VideoChat = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws/chat");
    socket.onmessage = handleWebSocketMessage;
    setSocket(socket);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        if (peerConnection.current) {
          stream.getTracks().forEach(track => {
            peerConnection.current!.addTrack(track, stream);
          });
        }
      })
      .catch(error => console.error("Erro ao acessar mídia local:", error));

    return () => {
      socket.close();
    };
  }, []);

  const handleWebSocketMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    if (message.type === 'offer') {
      handleOffer(message);
    } else if (message.type === 'answer') {
      handleAnswer(message);
    } else if (message.type === 'candidate') {
      handleCandidate(message);
    }
  };

  const handleOffer = (message: any) => {
    peerConnection.current = new RTCPeerConnection();

    // tracks de video e audio
    localStream?.getTracks().forEach(track => {
      peerConnection.current!.addTrack(track, localStream!);
    });

    peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
    peerConnection.current.createAnswer()
      .then(answer => peerConnection.current!.setLocalDescription(answer))
      .then(() => sendMessage({ type: 'answer', sdp: peerConnection.current!.localDescription }));

    peerConnection.current.ontrack = (event: RTCTrackEvent) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        sendMessage({ type: 'candidate', candidate: event.candidate });
      }
    };
  };

  const handleAnswer = (message: any) => {
    peerConnection.current!.setRemoteDescription(new RTCSessionDescription(message.sdp));
  };

  const handleCandidate = (message: any) => {
    const candidate = new RTCIceCandidate(message.candidate);
    peerConnection.current!.addIceCandidate(candidate);
  };

  const sendMessage = (message: any) => {
    socket?.send(JSON.stringify(message));
  };

  return (
    <div>
      <h1>glauber glauboso</h1>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
    </div>
  );
};

export default VideoChat;