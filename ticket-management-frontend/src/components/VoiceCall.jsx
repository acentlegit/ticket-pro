import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:4000/livekit';

export default function VoiceCall({ sessionId, roomName, onClose }) {
    const [room, setRoom] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const audioRef = useRef(null);
    const auth = useAuth();
    const user = auth?.user;

    useEffect(() => {
        connectToRoom();
        const interval = setInterval(() => {
            if (isConnected) {
                setCallDuration((prev) => prev + 1);
            }
        }, 1000);

        return () => {
            disconnectFromRoom();
            clearInterval(interval);
        };
    }, [isConnected]); // Added dependency to ensure interval correctness

    useEffect(() => {
        if (room) {
            room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
            room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        }

        return () => {
            if (room) {
                room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
                room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
            }
        };
    }, [room]);

    const connectToRoom = async () => {
        let connectionTimeout;
        try {
            // Set 30s timeout for connection
            connectionTimeout = setTimeout(() => {
                if (!isConnected) {
                    console.warn('Connection timed out');
                    alert('Connection timed out. Please try again.');
                    onClose();
                }
            }, 30000);

            const tokenResponse = await axios.post(`${API_URL}/token`, {
                roomName,
                participantName: user?.name || 'User ' + Math.floor(Math.random() * 1000),
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            const { token, url } = tokenResponse.data;

            const newRoom = new Room();

            // Handle disconnection
            newRoom.on(RoomEvent.Disconnected, () => {
                console.log('Voice call disconnected');
                setIsConnected(false);
                setRoom(null);
                onClose(); // Auto-close on disconnect
            });

            await newRoom.connect(url, token);
            clearTimeout(connectionTimeout); // Clear timeout on success

            // Enable microphone only (voice call)
            await newRoom.localParticipant.setMicrophoneEnabled(true);

            setRoom(newRoom);
            setIsConnected(true);
        } catch (error) {
            console.error('Error connecting to room:', error);
            clearTimeout(connectionTimeout); // Clear timeout on error
            alert('Failed to connect to voice call. Please try again.');
            onClose(); // Auto-close on error
        }
    };

    const disconnectFromRoom = async () => {
        if (room) {
            room.disconnect();
            setRoom(null);
        }
        setIsConnected(false);
    };

    const handleTrackSubscribed = (track, publication, participant) => {
        if (track.kind === 'audio' && audioRef.current) {
            track.attach(audioRef.current);
        }
    };

    const handleTrackUnsubscribed = (track) => {
        track.detach();
    };

    const toggleMute = async () => {
        if (room) {
            await room.localParticipant.setMicrophoneEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    };

    const handleEndCall = () => {
        disconnectFromRoom();
        onClose();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">📞</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Voice Call</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isConnected ? 'Connected' : 'Connecting...'}
                    </p>
                    {isConnected && (
                        <p className="text-blue-600 dark:text-blue-400 font-semibold mt-2">
                            {formatTime(callDuration)}
                        </p>
                    )}
                </div>

                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={toggleMute}
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${isMuted
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </button>
                    <button
                        onClick={handleEndCall}
                        className="w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-2xl transition"
                    >
                        📞
                    </button>
                </div>

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Room: {roomName}</p>
                    <p className="mt-2">Waiting for others to join...</p>
                </div>

                <audio ref={audioRef} autoPlay playsInline className="hidden" />
            </div>
        </div>
    );
}
