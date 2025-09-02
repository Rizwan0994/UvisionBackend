'use strict';

const {
    conversation: ConversationModel,
    simpleMessage: SimpleMessageModel,
    user: UserModel,
    Op
} = require('../models/index');

module.exports = (io, socket) => {
    let currentRoom = null;
    
    // Join single conversation room
    socket.on('join', async (conversationId) => {
        try {
            const userId = socket.handshake.query.loginUser?.id;
            
            if (!userId) {
                socket.emit('error', { message: 'User not authenticated' });
                return;
            }
            
            // Validate user has access to this conversation
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
                socket.emit('error', { message: 'Conversation not found or access denied' });
                return;
            }
            
            // Leave previous room if different
            if (currentRoom && currentRoom !== conversationId) {
                console.log('Leaving previous room:', currentRoom);
                socket.leave(currentRoom);
            }
            
            // Join new room (or stay in current if same)
            if (currentRoom !== conversationId) {
                currentRoom = conversationId;
                socket.join(conversationId);
                console.log('User joined room:', {
                    userId: socket.handshake.query.loginUser.id,
                    conversationId,
                    currentRoom,
                    socketRooms: Array.from(socket.rooms)
                });
            } else {
                console.log('User already in room:', conversationId);
            }
            
            socket.emit('joined', { conversationId });
            
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });
    
    // Leave conversation room
    socket.on('leave', (conversationId) => {
        try {
            console.log('User leaving room:', {
                userId: socket.handshake.query.loginUser?.id,
                conversationId,
                currentRoom
            });
            
            if (currentRoom === conversationId) {
                socket.leave(conversationId);
                currentRoom = null;
                console.log('User left room:', conversationId);
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    });
    
    // Send message
    socket.on('message', async (data, callback) => {
        try {
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
            
            const senderId = socket.handshake.query.loginUser?.id;
            
            if (!senderId) {
                throw new Error('User not authenticated');
            }
            
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
            
            console.log('Message created in database:', newMessage.toJSON());
            
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
            
            console.log('Conversation updated with last message');
            
            // Get message with sender details
            const messageWithSender = await SimpleMessageModel.scope('withSender').findByPk(newMessage.id);
            
            if (!messageWithSender) {
                throw new Error('Failed to fetch message with sender details');
            }
            
            console.log('Message with sender details:', messageWithSender.toJSON());
            
            // Send to room (no prefix needed)
            const roomMembers = io.sockets.adapter.rooms.get(conversationId);
            console.log('Room members for conversation', conversationId, ':', roomMembers ? roomMembers.size : 0);
            
            io.to(conversationId).emit('message', {
                conversationId,
                message: messageWithSender.toJSON()
            });
            
            console.log('Message emitted to room:', conversationId);
            
            // Send success response to sender
            if (callback) {
                callback({
                    success: true,
                    message: messageWithSender.toJSON()
                });
            }
            
        } catch (error) {
            const errorResponse = {
                success: false,
                error: error.message || 'Failed to send message'
            };
            
            if (callback) {
                callback(errorResponse);
            } else {
                socket.emit('error', {
                    message: error.message || 'Failed to send message'
                });
            }
        }
    });
    
    // Mark messages as read
    socket.on('read', async (data) => {
        try {
            const userId = socket.handshake.query.loginUser.id;
            const { conversationId, messageIds = [] } = data;
            
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
            
            // If no specific message IDs provided, mark all unread messages in conversation
            let whereClause = {
                conversationId,
                senderId: { [Op.ne]: userId }, // Don't mark own messages
                isRead: false
            };
            
            if (messageIds.length > 0) {
                whereClause.id = { [Op.in]: messageIds };
            }
            
            const [updatedCount] = await SimpleMessageModel.update({
                isRead: true,
                readAt: new Date()
            }, {
                where: whereClause
            });
            
            // Notify the conversation room about read status
            io.to(conversationId).emit('read', {
                conversationId,
                messageIds,
                readBy: userId,
                readAt: new Date()
            });
            
        } catch (error) {
            socket.emit('error', {
                message: error.message || 'Failed to mark messages as read'
            });
        }
    });
    
    // Cleanup on disconnect
    socket.on('disconnect', () => {
        if (currentRoom) {
            socket.leave(currentRoom);
        }
    });
};
