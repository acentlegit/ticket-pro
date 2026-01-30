import express from 'express';
import ChatSession from '../models/ChatSession.js';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create chat session
router.post('/chat/session', authenticateToken, async (req, res) => {
    try {
        const { type, ticketId } = req.body;

        if (!['chat', 'voice', 'video'].includes(type)) {
            return res.status(400).json({ error: 'Invalid session type' });
        }

        const session = new ChatSession({
            customerId: req.user._id,
            type,
            ticketId,
            status: 'waiting'
        });

        await session.save();

        const populatedSession = await ChatSession.findById(session._id)
            .populate('customerId', 'fullName email')
            .populate('agentId', 'fullName email')
            .populate('ticketId');

        res.status(201).json(populatedSession);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active sessions
router.get('/chat/sessions', authenticateToken, async (req, res) => {
    try {
        const query = { status: { $in: ['waiting', 'active'] } };

        if (req.user.role === 'requester') {
            query.customerId = req.user._id;
        } else if (req.user.role === 'agent') {
            query.agentId = req.user._id;
        }

        const sessions = await ChatSession.find(query)
            .populate('customerId', 'fullName email')
            .populate('agentId', 'fullName email')
            .populate('ticketId')
            .sort({ startedAt: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join session (agent)
router.post('/chat/session/:id/join', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'agent' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only agents can join sessions' });
        }

        const session = await ChatSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status === 'ended') {
            return res.status(400).json({ error: 'Session has ended' });
        }

        session.agentId = req.user._id;
        session.status = 'active';
        await session.save();

        const populatedSession = await ChatSession.findById(session._id)
            .populate('customerId', 'fullName email')
            .populate('agentId', 'fullName email')
            .populate('ticketId');

        res.json(populatedSession);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End session
router.post('/chat/session/:id/end', authenticateToken, async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        session.status = 'ended';
        session.endedAt = new Date();
        session.duration = (session.endedAt.getTime() - session.startedAt.getTime()) / 1000;
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get messages for a session
router.get('/chat/session/:sessionId/messages', authenticateToken, async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Verify key access permissions if needed (e.g. only participants)
        // For now allowing if authenticated, similar to other routes

        const messages = await Message.find({ sessionId: req.params.sessionId })
            .populate('senderId', 'fullName email')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message to a session
router.post('/chat/session/:sessionId/message', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { content, type } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status === 'ended') {
            return res.status(400).json({ error: 'Cannot send message to ended session' });
        }

        const message = new Message({
            sessionId,
            senderId: req.user._id,
            senderRole: req.user.role === 'requester' ? 'customer' : req.user.role,
            content,
            type: type || 'text'
        });

        await message.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'fullName email');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
