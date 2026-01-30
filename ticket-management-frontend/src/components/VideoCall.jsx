import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Creating assumption on AuthContext path, will verify

// Use configured axios instance in real app, but for now direct axios or import from existing 'api'
// Checking existing code reveals use of axios directly or via a service. 
// I will use a direct axios call with the token for now or look for an api service file.
// Ideally I should check src/services/api.js if it exists.

const API_URL = 'http://localhost:4000/livekit'; // Adjust based on backend port

export default function VideoCall({ sessionId, roomName, onClose }) {
    const [room, setRoom] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [remoteParticipants, setRemoteParticipants] = useState([]);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Assuming AuthContext provides user object
    // If not, we might need to pass username as prop
    const auth = useAuth(); // Might need adjustment based on actual context
    const user = auth?.user;

    useEffect(() => {
        connectToRoom();
        return () => {
            disconnectFromRoom();
        };
    }, []);

    useEffect(() => {
        if (room) {
            room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
            room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
            room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
            room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        }

        return () => {
            if (room) {
                room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
                room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
                room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
                room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
            }
        };
    }, [room]);

    const connectToRoom = async () => {
        let connectionTimeout;
        try {
            // Set 30s timeout
            connectionTimeout = setTimeout(() => {
                if (!isConnected) {
                    console.warn('Connection timed out');
                    alert('Connection timed out. Please try again.');
                    onClose();
                }
            }, 30000);

            // Get LiveKit token from backend
            // Using direct axios for simplicity, verify if there is an intercepted instance
            const tokenResponse = await axios.post(`${API_URL}/token`, {
                roomName,
                participantName: user?.name || 'User ' + Math.floor(Math.random() * 1000),
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}` // Basic auth assumption
                }
            });

            const { token, url } = tokenResponse.data;

            // Create room and connect
            const newRoom = new Room();

            // Set up event listeners before connecting
            newRoom.on(RoomEvent.Connected, () => {
                console.log('Connected to LiveKit room');
                setIsConnected(true);
                clearTimeout(connectionTimeout); // Clear timeout on success
            });

            newRoom.on(RoomEvent.Disconnected, () => {
                console.log('Disconnected from LiveKit room');
                setIsConnected(false);
                onClose(); // Auto-close on disconnect
            });

            await newRoom.connect(url, token);

            // Enable camera and microphone
            try {
                await newRoom.localParticipant.enableCameraAndMicrophone();
            } catch (mediaError) {
                console.error('Error enabling media:', mediaError);
                // Continue even if media fails - user can enable manually
            }

            setRoom(newRoom);

            // Attach local video track when available
            const attachLocalVideo = () => {
                newRoom.localParticipant.videoTrackPublications.forEach((publication) => {
                    if (publication.track && localVideoRef.current) {
                        publication.track.attach(localVideoRef.current);
                    }
                });
            };

            // Try immediately and also listen for new tracks
            attachLocalVideo();
            newRoom.localParticipant.on('trackPublished', attachLocalVideo);
        } catch (error) {
            console.error('Error connecting to room:', error);
            clearTimeout(connectionTimeout); // Clear timeout on error
            const errorMsg = error.response?.data?.error || error.message || 'Failed to connect';
            alert(`Failed to connect to video call: ${errorMsg}`);
            onClose(); // Auto-close on error
        }
    };

    const disconnectFromRoom = async () => {
        if (room) {
            room.disconnect();
            setRoom(null);
            setIsConnected(false);
        }
    };

    const handleParticipantConnected = (participant) => {
        setRemoteParticipants((prev) => [...prev, participant]);
    };

    const handleParticipantDisconnected = (participant) => {
        setRemoteParticipants((prev) => prev.filter((p) => p !== participant));
    };

    const handleTrackSubscribed = (track, publication, participant) => {
        if (track.kind === 'video' && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
        }
    };

    const handleTrackUnsubscribed = (track) => {
        track.detach();
    };

    const toggleVideo = async () => {
        if (room) {
            await room.localParticipant.setCameraEnabled(!isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = async () => {
        if (room) {
            await room.localParticipant.setMicrophoneEnabled(!isAudioEnabled);
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const handleEndCall = () => {
        disconnectFromRoom();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="w-full h-full flex flex-col">
                {/* Remote video (main) */}
                <div className="flex-1 relative bg-gray-900">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {remoteParticipants.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📹</div>
                                <p className="text-xl">Waiting for others to join...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Local video (small) */}
                <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button
                        onClick={toggleAudio}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${isAudioEnabled
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                    >
                        {isAudioEnabled ? '🎤' : '🔇'}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${isVideoEnabled
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                    >
                        {isVideoEnabled ? '📹' : '📷'}
                    </button>
                    <button
                        onClick={handleEndCall}
                        className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-2xl transition"
                    >
                        📞
                    </button>
                </div>

                {/* Status */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                    {isConnected ? 'Connected' : 'Connecting...'}
                </div>
            </div>
        </div>
    );
}
