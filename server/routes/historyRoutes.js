const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

/**
 * GET /api/history/:sessionId
 * Get chat history for a session
 */
router.get('/history/:sessionId', async (req, res) => {
    try {
        const session = await Session.findOne({ sessionId: req.params.sessionId });
        if (!session) {
            return res.json({ sessionId: req.params.sessionId, messages: [], bookmarks: [] });
        }
        res.json({
            sessionId: session.sessionId,
            patientName: session.patientName,
            messages: session.messages,
            bookmarks: session.bookmarks,
            createdAt: session.createdAt
        });
    } catch (err) {
        console.error('History fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * GET /api/history
 * Get all recent sessions
 */
router.get('/history', async (req, res) => {
    try {
        const sessions = await Session.find({})
            .sort({ updatedAt: -1 })
            .limit(20)
            .select('sessionId patientName messages updatedAt createdAt');

        res.json(sessions.map(s => ({
            sessionId: s.sessionId,
            patientName: s.patientName,
            messageCount: s.messages.length,
            lastQuery: s.messages.filter(m => m.role === 'user').pop()?.content || '',
            updatedAt: s.updatedAt,
            createdAt: s.createdAt
        })));
    } catch (err) {
        console.error('Sessions fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

/**
 * POST /api/history/:sessionId/bookmark
 * Save a bookmark
 */
router.post('/history/:sessionId/bookmark', async (req, res) => {
    try {
        const { type, itemId, title, url } = req.body;
        const session = await Session.findOne({ sessionId: req.params.sessionId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if already bookmarked
        const exists = session.bookmarks.some(b => b.itemId === itemId);
        if (exists) {
            session.bookmarks = session.bookmarks.filter(b => b.itemId !== itemId);
            await session.save();
            return res.json({ bookmarked: false, message: 'Bookmark removed' });
        }

        session.bookmarks.push({ type, itemId, title, url });
        await session.save();
        res.json({ bookmarked: true, message: 'Bookmarked successfully' });
    } catch (err) {
        console.error('Bookmark error:', err.message);
        res.status(500).json({ error: 'Failed to save bookmark' });
    }
});

/**
 * DELETE /api/history/:sessionId
 * Delete a session
 */
router.delete('/history/:sessionId', async (req, res) => {
    try {
        await Session.deleteOne({ sessionId: req.params.sessionId });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

module.exports = router;
