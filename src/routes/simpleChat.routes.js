'use strict';

const router = require('express').Router();
const { catchAsync } = require('../util/catchAsync');
const {
    createOrGetConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    markMessagesAsRead
} = require('../controllers/simpleChat.controller');

/**
 * Create or get existing conversation with a professional
 * POST /api/simple-chat/conversation
 * Body: { professionalId: number }
 */
router.post('/conversation', catchAsync(async function _createOrGetConversation(req, res) {
    const data = await createOrGetConversation(req.body, req.loginUser);
    res.success(data);
}));

/**
 * Get all conversations for the logged-in user
 * POST /api/simple-chat/conversations
 * Body: { page?: number, limit?: number }
 */
router.post('/conversations', catchAsync(async function _getUserConversations(req, res) {
    const data = await getUserConversations(req.body, req.loginUser);
    res.success(data);
}));

/**
 * Get messages from a specific conversation
 * POST /api/simple-chat/messages
 * Body: { conversationId: number, page?: number, limit?: number }
 */
router.post('/messages', catchAsync(async function _getConversationMessages(req, res) {
    const data = await getConversationMessages(req.body, req.loginUser);
    res.success(data);
}));

/**
 * Send a message (HTTP fallback)
 * POST /api/simple-chat/send
 * Body: { conversationId: number, message: string, messageType?: 'text'|'image'|'file', fileUrl?: string, fileName?: string }
 */
router.post('/send', catchAsync(async function _sendMessage(req, res) {
    const data = await sendMessage(req.body, req.loginUser);
    res.success(data);
}));

/**
 * Mark messages as read
 * POST /api/simple-chat/mark-read
 * Body: { conversationId: number, messageIds?: number[] }
 */
router.post('/mark-read', catchAsync(async function _markMessagesAsRead(req, res) {
    const data = await markMessagesAsRead(req.body, req.loginUser);
    res.success(data);
}));

module.exports = router;
