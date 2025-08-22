'use strict';

const {
    conversation: ConversationModel,
    simpleMessage: SimpleMessageModel,
    user: UserModel,
    Op
} = require('../models/index');

// In-memory store for online users in simple chat
const onlineUsers = new Set();

module.exports = (io, socket) => {
    console.log('Simple chat socket initialized for user:', socket.handshake.query.loginUser?.id);
    
    const userId = socket.handshake.query.loginUser?.id;
    
    // Add user to online users and broadcast update
    if (userId && !onlineUsers.has(userId)) {
        onlineUsers.add(userId);
        io.emit('simple-chat:online-users', Array.from(onlineUsers));
        console.log(`📢 User ${userId} came online. Total online: ${onlineUsers.size}`);
    }

    // Join user to their conversation rooms
    socket.on('simple-chat:join-conversations', async () => {
        try {
            const userId = socket.handshake.query.loginUser.id;
            console.log(`🏠 User ${userId} requesting to join conversation rooms`);
            
            // Find all conversations for this user
            const conversations = await ConversationModel.scope('active').findAll({
                where: {
                    [Op.or]: [
                        { clientId: userId },
                        { professionalId: userId }
                    ]
                },
                attributes: ['id']
            });

            console.log(`📋 Found ${conversations.length} conversations for user ${userId}`);

            // Join each conversation room
            conversations.forEach(conversation => {
                const roomName = `conversation_${conversation.id}`;
                socket.join(roomName);
                console.log(`✅ User ${userId} joined room: ${roomName}`);
            });

            socket.emit('simple-chat:joined-conversations', {
                success: true,
                conversationCount: conversations.length
            });

            // Send current online users to the newly connected user
            socket.emit('simple-chat:online-users', Array.from(onlineUsers));

            console.log(`🎯 User ${userId} successfully joined ${conversations.length} conversation rooms`);

        } catch (error) {
            console.error('❌ Error joining conversations:', error);
            socket.emit('simple-chat:error', {
                event: 'join-conversations',
                message: 'Failed to join conversations'
            });
        }
    });

    // Send a message
    socket.on('simple-chat:send-message', async (data, callback) => {
        try {
            const senderId = socket.handshake.query.loginUser.id;
            const { 
                conversationId, 
                message, 
                messageType = 'text', 
                fileUrl, 
                fileName,
                originalFileName,
                fileSize,
                mimeType,
                s3Key
            } = data;

            console.log('Sending message:', { conversationId, senderId, messageType, hasFile: !!fileUrl });

            // Validate conversation exists and user is part of it
            const conversation = await ConversationModel.scope('active').findOne({
                where: {
                    id: conversationId,
                    [Op.or]: [
                        { clientId: senderId },
                        { professionalId: senderId }
                    ]
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found or access denied');
            }

            // Determine message type if file is being sent
            let finalMessageType = messageType;
            if (fileUrl && mimeType) {
                if (mimeType.startsWith('image/')) {
                    finalMessageType = 'image';
                } else if (mimeType.startsWith('video/')) {
                    finalMessageType = 'video';
                } else if (mimeType === 'application/pdf' || mimeType.includes('document') || mimeType.includes('word')) {
                    finalMessageType = 'document';
                } else {
                    finalMessageType = 'file';
                }
            }

            // Create the message
            const newMessage = await SimpleMessageModel.create({
                conversationId,
                senderId,
                message: message || '',
                messageType: finalMessageType,
                fileUrl,
                fileName,
                originalFileName,
                fileSize,
                mimeType,
                s3Key
            });

            // Generate appropriate last message preview
            let lastMessagePreview = message || '';
            if (fileUrl) {
                switch (finalMessageType) {
                    case 'image':
                        lastMessagePreview = '📷 Image';
                        break;
                    case 'video':
                        lastMessagePreview = '🎥 Video';
                        break;
                    case 'document':
                        lastMessagePreview = '📄 Document';
                        break;
                    default:
                        lastMessagePreview = '📎 File';
                }
                if (message) {
                    lastMessagePreview = `${lastMessagePreview}: ${message}`;
                }
            }

            // Update conversation's last message info
            await ConversationModel.update({
                lastMessageAt: new Date(),
                lastMessage: lastMessagePreview,
                lastMessageBy: senderId
            }, {
                where: { id: conversationId }
            });

            // Get message with sender details
            const messageWithSender = await SimpleMessageModel.scope('withSender').findByPk(newMessage.id);

            // Broadcast to conversation room
            const roomName = `conversation_${conversationId}`;
            console.log(`📢 Broadcasting message to room: ${roomName}`);
            
            // Get all clients in the room for debugging
            const roomClients = io.sockets.adapter.rooms.get(roomName);
            console.log(`👥 Clients in room ${roomName}:`, roomClients ? Array.from(roomClients) : 'None');
            
            io.to(roomName).emit('simple-chat:new-message', {
                conversationId,
                message: messageWithSender.toJSON()
            });

            // Send success response to sender
            if (callback) {
                callback({
                    success: true,
                    message: messageWithSender.toJSON()
                });
            }

            console.log(`✅ Message sent in conversation ${conversationId} by user ${senderId}`, {
                type: finalMessageType,
                hasFile: !!fileUrl,
                roomName,
                clientsInRoom: roomClients ? roomClients.size : 0
            });

        } catch (error) {
            console.error('Error sending message:', error);
            
            const errorResponse = {
                success: false,
                error: error.message || 'Failed to send message'
            };

            if (callback) {
                callback(errorResponse);
            } else {
                socket.emit('simple-chat:error', {
                    event: 'send-message',
                    ...errorResponse
                });
            }
        }
    });

    // Mark messages as read
    socket.on('simple-chat:mark-read', async (data) => {
        try {
            const userId = socket.handshake.query.loginUser.id;
            const { conversationId, messageIds } = data;

            // Validate conversation access
            const conversation = await ConversationModel.scope('active').findOne({
                where: {
                    id: conversationId,
                    [Op.or]: [
                        { clientId: userId },
                        { professionalId: userId }
                    ]
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found or access denied');
            }

            // Mark messages as read (only messages not sent by this user)
            const updatedMessages = await SimpleMessageModel.update({
                isRead: true,
                readAt: new Date()
            }, {
                where: {
                    id: { [Op.in]: messageIds },
                    conversationId,
                    senderId: { [Op.ne]: userId }, // Don't mark own messages as read
                    isRead: false
                },
                returning: true
            });

            // Notify the conversation room about read status
            const roomName = `conversation_${conversationId}`;
            io.to(roomName).emit('simple-chat:messages-read', {
                conversationId,
                messageIds,
                readBy: userId,
                readAt: new Date()
            });

            socket.emit('simple-chat:mark-read-success', {
                conversationId,
                markedCount: updatedMessages[0] || 0
            });

        } catch (error) {
            console.error('Error marking messages as read:', error);
            socket.emit('simple-chat:error', {
                event: 'mark-read',
                message: error.message || 'Failed to mark messages as read'
            });
        }
    });

    // Handle typing indicators
    socket.on('simple-chat:typing', (data) => {
        try {
            const { conversationId, isTyping } = data;
            const userId = socket.handshake.query.loginUser.id;
            const userName = socket.handshake.query.loginUser.fullName;

            const roomName = `conversation_${conversationId}`;
            
            // Broadcast typing status to others in the conversation
            socket.to(roomName).emit('simple-chat:user-typing', {
                conversationId,
                userId,
                userName,
                isTyping
            });

        } catch (error) {
            console.error('Error handling typing indicator:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const userId = socket.handshake.query.loginUser?.id;
        console.log('Simple chat socket disconnected for user:', userId);
        
        // Remove user from online users and broadcast update
        if (userId && onlineUsers.has(userId)) {
            onlineUsers.delete(userId);
            io.emit('simple-chat:online-users', Array.from(onlineUsers));
            console.log(`📢 User ${userId} went offline. Total online: ${onlineUsers.size}`);
        }
    });
};
