import express from 'express';
import Message from '../models/Message.js';
import ChatSession from '../models/ChatSession.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a session
router.get('/messages/session/:sessionId', authenticateToken, async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const messages = await Message.find({ sessionId: req.params.sessionId })
            .populate('senderId', 'fullName email')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message
router.post('/messages', authenticateToken, async (req, res) => {
    try {
        const { sessionId, content, type } = req.body;

        if (!sessionId || !content) {
            return res.status(400).json({ error: 'Session ID and content are required' });
        }

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
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
