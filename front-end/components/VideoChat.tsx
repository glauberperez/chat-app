import React, { useEffect, useState, useRef } from 'react';

const VideoChat = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Função para conectar o WebSocket com reconexão automática
    const connectWebSocket = () => {
      const socket = new WebSocket("wss://chat-app-deploy-2b6w.onrender.com/ws/chat");
      
      socket.onopen = () => {
        console.log("Conexão WebSocket aberta");
        
        // Enviar "ping" a cada 30 segundos para manter a conexão ativa
        setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 30 segundos
      };
      
      socket.onmessage = handleWebSocketMessage;

      socket.onclose = (event) => {
        console.log("Conexão WebSocket fechada", event);
        // Tentar reconectar após 1 segundo, se a conexão for fechada
        setTimeout(() => {
          console.log("Tentando reconectar...");
          connectWebSocket();
        }, 1000);
      };

      socket.onerror = (error) => {
        console.error("Erro WebSocket:", error);
      };

      setSocket(socket);
    };

    // Iniciar conexão WebSocket
    connectWebSocket();

    // Limpar a conexão WebSocket quando o componente for desmontado
    return () => {
      socket?.close();
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
    } else if (message.type === 'ping') {
      // Responder ao ping para manter a conexão ativa
      socket?.send(JSON.stringify({ type: 'pong' }));
    }
  };

  const handleOffer = (message: any) => {
    peerConnection.current = new RTCPeerConnection();

    localStream?.getTracks().forEach((track) => {
      peerConnection.current!.addTrack(track, localStream!);
    });

    peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.sdp));
    peerConnection.current.createAnswer()
      .then((answer) => peerConnection.current!.setLocalDescription(answer))
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
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <video
          ref={localVideoRef}
          style={styles.video}
          autoPlay
          muted
        />
        <video
          ref={remoteVideoRef}
          style={styles.video}
          autoPlay
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f0f0f0',
  },
  videoContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '20px',
  },
  video: {
    width: '600px',
    height: '400px',
    border: '2px solid #ddd',
    borderRadius: '8px',
  },
};

export default VideoChat;
