'use strict';

const {
    conversation: ConversationModel,
    simpleMessage: SimpleMessageModel,
    user: UserModel,
    professionalProfile: ProfessionalProfileModel,
    Op
} = require('../models/index');

/**
 * Create or get existing conversation between client and professional
 */
exports.createOrGetConversation = async (data, loginUser) => {
    try {
        const { professionalId } = data;
        const clientId = loginUser.id;

        // Don't allow user to chat with themselves
        if (clientId === parseInt(professionalId)) {
            throw new Error("Cannot create conversation with yourself");
        }

        // Validate that the professional user exists and has an active professional profile
        const professionalUser = await UserModel.findOne({
            where: { id: professionalId },
            include: [{
                model: ProfessionalProfileModel,
                as: 'professionalProfile',
                where: { isActive: true, isDeleted: false },
                required: true
            }]
        });

        if (!professionalUser) {
            throw new Error("Professional not found or inactive");
        }

        const professionalUserId = professionalUser.id;

        // Try to find existing conversation
        let conversation = await ConversationModel.scope('withUsers').findOne({
            where: {
                [Op.or]: [
                    { clientId: clientId, professionalId: professionalUserId },
                    { clientId: professionalUserId, professionalId: clientId }
                ],
                isActive: true
            }
        });

        // Create new conversation if doesn't exist
        if (!conversation) {
            conversation = await ConversationModel.create({
                clientId: clientId,
                professionalId: professionalUserId,
                lastMessageAt: new Date()
            });

            // Fetch the conversation with user details
            conversation = await ConversationModel.scope('withUsers').findByPk(conversation.id);
        }

        return {
            status: 1,
            message: "Conversation created/retrieved successfully",
            data: conversation
        };

    } catch (error) {
        console.error('Error in createOrGetConversation:', error);
        throw error;
    }
};

/**
 * Get all conversations for a user
 */
exports.getUserConversations = async (data, loginUser) => {
    try {
        const userId = loginUser.id;
        const { page = 1, limit = 20 } = data;

        const offset = (page - 1) * limit;

        const conversations = await ConversationModel.scope(['withUsers', 'withLastMessage']).findAndCountAll({
            where: {
                [Op.or]: [
                    { clientId: userId },
                    { professionalId: userId }
                ],
                isActive: true
            },
            order: [['lastMessageAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        return {
            status: 1,
            message: "Conversations retrieved successfully",
            data: {
                conversations: conversations.rows,
                totalCount: conversations.count,
                currentPage: page,
                totalPages: Math.ceil(conversations.count / limit)
            }
        };

    } catch (error) {
        console.error('Error in getUserConversations:', error);
        throw error;
    }
};

/**
 * Get messages from a conversation
 */
exports.getConversationMessages = async (data, loginUser) => {
    try {
        const { conversationId, page = 1, limit = 50 } = data;
        const userId = loginUser.id;

        const offset = (page - 1) * limit;

        // Verify user has access to this conversation
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
            throw new Error("Conversation not found or access denied");
        }

        // Get messages
        const messages = await SimpleMessageModel.scope('withSender').findAndCountAll({
            where: {
                conversationId: conversationId
            },
            order: [['createdAt', 'ASC']], // Oldest first for chat display
            limit: limit,
            offset: offset
        });

        return {
            status: 1,
            message: "Messages retrieved successfully",
            data: {
                messages: messages.rows,
                totalCount: messages.count,
                currentPage: page,
                totalPages: Math.ceil(messages.count / limit),
                conversationId: conversationId
            }
        };

    } catch (error) {
        console.error('Error in getConversationMessages:', error);
        throw error;
    }
};

/**
 * Send a message (HTTP fallback if socket fails)
 */
exports.sendMessage = async (data, loginUser) => {
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
        const senderId = loginUser.id;

        // Verify user has access to this conversation
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
            throw new Error("Conversation not found or access denied");
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

        return {
            status: 1,
            message: "Message sent successfully",
            data: messageWithSender
        };

    } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
    }
};

/**
 * Mark messages as read
 */
exports.markMessagesAsRead = async (data, loginUser) => {
    try {
        const { conversationId, messageIds = [] } = data;
        const userId = loginUser.id;

        // Verify user has access to this conversation
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
            throw new Error("Conversation not found or access denied");
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

        return {
            status: 1,
            message: "Messages marked as read",
            data: {
                conversationId,
                markedCount: updatedCount
            }
        };

    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        throw error;
    }
};
