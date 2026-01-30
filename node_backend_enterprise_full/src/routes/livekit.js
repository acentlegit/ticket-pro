import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { authenticateToken as authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get LiveKit token for video/voice calls
// Using authenticate middleware to ensure user is logged in
router.post('/token', authenticate, async (req, res) => {
    try {
        const { roomName, participantName } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ error: 'roomName and participantName are required' });
        }

        // LiveKit server configuration
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.LIVEKIT_URL;

        if (!apiKey || !apiSecret || !livekitUrl) {
            console.error("LiveKit credentials missing in .env");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Create access token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: req.user.id || req.user._id, // Handle potential differences in user object structure
            name: participantName,
        });

        // Grant permissions
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        res.json({
            token,
            url: livekitUrl,
            roomName,
        });
    } catch (error) {
        console.error("Error generating LiveKit token:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
