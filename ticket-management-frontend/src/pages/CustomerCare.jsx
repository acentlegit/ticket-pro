import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Phone, Video, Send, User, Headphones as HeadphonesIcon, Plus } from 'lucide-react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ChatWindow from '../components/ChatWindow';
import VoiceCall from '../components/VoiceCall';
import VideoCall from '../components/VideoCall';

const CustomerCare = () => {
    const { user } = useAuth()
    const [socket, setSocket] = useState(null)
    const [activeSessions, setActiveSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0
    })
    const [currentSession, setCurrentSession] = useState(null);

    // Socket initialization
    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000')
        setSocket(newSocket)

        newSocket.on('connect', () => {
            console.log('Connected to socket server:', newSocket.id)
            newSocket.emit('join-care', { userId: user?._id || user?.id, role: user?.role })
        })

        newSocket.on('sessions:refresh', () => {
            fetchActiveSessions()
        })

        newSocket.on('chat:message', (msg) => {
            // In a real app, we'd probably update the specific session's message list
            // For now, let's just refresh active sessions to show new message indicators if any
            fetchActiveSessions()
        })

        fetchActiveSessions()

        return () => {
            if (newSocket) newSocket.close()
        }
    }, [user])

    const fetchActiveSessions = async () => {
        try {
            const response = await api.get('/chat/sessions')
            setActiveSessions(response.data)

            // Calculate stats based on retrieved sessions for demonstration
            // In a real production app, these would come from a dedicated stats endpoint
            const total = response.data.length
            const open = response.data.filter(s => s.status === 'waiting').length
            const inProgress = response.data.filter(s => s.status === 'active').length
            const resolved = response.data.filter(s => s.status === 'ended').length

            setStats({ total, open, inProgress, resolved })
        } catch (error) {
            console.error('Error fetching sessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const requestMediaPermissions = async (type) => {
        if (type === 'chat') return true;

        try {
            const constraints = {
                audio: true,
                video: type === 'video'
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // Immediately stop tracks after confirming permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Media permission denied:', error);
            const device = type === 'video' ? 'Camera and Microphone' : 'Microphone';
            alert(`Access to ${device} is required for this session. Please enable permissions in your browser.`);
            return false;
        }
    };

    const handleStartSession = async (type) => {
        // Request permissions first for voice/video
        const hasPermission = await requestMediaPermissions(type);
        if (!hasPermission) return;

        try {
            const response = await api.post('/chat/session', { type })
            const sessionData = response.data;

            if (socket) {
                socket.emit('session:update', { sessionId: sessionData._id, session: sessionData })
            }
            fetchActiveSessions()

            // Open the appropriate component
            setCurrentSession({
                id: sessionData._id,
                type: type,
                roomName: `session-${sessionData._id}` // Use session ID as room name
            });

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to start session')
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Customer Support</h1>
                    <p className="text-slate-500 text-sm">24/7 Customer Support</p>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => handleStartSession('chat')}
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left"
                >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Chat Support</h3>
                    <p className="text-slate-500 text-sm">Start a text chat with an agent</p>
                </button>

                <button
                    onClick={() => handleStartSession('voice')}
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left"
                >
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Phone className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Voice Call</h3>
                    <p className="text-slate-500 text-sm">Connect via voice call</p>
                </button>

                <button
                    onClick={() => handleStartSession('video')}
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group text-left"
                >
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Video className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Video Call</h3>
                    <p className="text-slate-500 text-sm">Start a video call session</p>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Total</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Open</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">In Progress</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.inProgress}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Resolved</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.resolved}</p>
                </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-[#e0f7fa] dark:bg-slate-800/50 p-6 rounded-2xl border border-blue-100 dark:border-slate-700 min-h-[300px]">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Active Sessions</h3>
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : activeSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-500 italic">
                        <HeadphonesIcon className="w-12 h-12 mb-2 opacity-20" />
                        <p>No active sessions found. Start a call or chat above.</p>
                    </div>
                ) : (
                    <div className="bg-white/50 dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm">
                        {activeSessions.map((session, index) => (
                            <div
                                key={session._id}
                                className={`flex justify-between items-center p-4 ${index !== activeSessions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${session.type === 'chat' ? 'bg-blue-100 text-blue-600' :
                                        session.type === 'voice' ? 'bg-red-100 text-red-600' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {session.type === 'chat' ? <MessageSquare className="w-4 h-4" /> :
                                            session.type === 'voice' ? <Phone className="w-4 h-4" /> :
                                                <Video className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-800 dark:text-white capitalize">
                                            {session.type} Session
                                        </span>
                                        <p className="text-xs text-slate-500">
                                            ID: {session._id.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${session.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-amber-100 text-amber-700'
                                    }`}>
                                    {session.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Active Session Modals */}
            {currentSession && currentSession.type === 'chat' && (
                <ChatWindow
                    sessionId={currentSession.id}
                    onClose={() => setCurrentSession(null)}
                />
            )}

            {currentSession && currentSession.type === 'voice' && (
                <VoiceCall
                    sessionId={currentSession.id}
                    roomName={currentSession.roomName}
                    onClose={() => setCurrentSession(null)}
                />
            )}

            {currentSession && currentSession.type === 'video' && (
                <VideoCall
                    sessionId={currentSession.id}
                    roomName={currentSession.roomName}
                    onClose={() => setCurrentSession(null)}
                />
            )}
        </div>
    )
}

export default CustomerCare
