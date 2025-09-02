const { USER_FIELDS } = require("../../constants/user.constant")

exports.userModel = (db) => {
    db.user.hasMany(db.chatUser, { foreignKey: 'userId' });
    db.user.hasMany(db.messageRecipient,{ foreignKey: 'recipientId'});
    db.user.hasMany(db.message, { foreignKey: 'sendBy'});
    db.user.hasMany(db.userDesignations,{foreignKey : 'userId'});
    db.user.hasMany(db.userLogs, { foreignKey : "userId" });
    db.user.hasMany(db.logs, { foreignKey: "userId" });
    db.user.hasMany(db.logs, { foreignKey: "updatedBy" });
    db.user.hasMany(db.FCMToken, { foreignKey: "userId" });
    db.user.hasMany(db.note, { foreignKey: "createdBy" });
    db.user.hasMany(db.note, { foreignKey: "lastUpdatedBy" });
    db.user.hasMany(db.messageEmoji, { foreignKey: "userId"});
    db.user.hasOne(db.professionalProfile, { foreignKey: "userId", as: 'professionalProfile'});
    db.user.belongsTo(db.roles, {foreignKey: "role", sourceKey: 'id', as: 'roleData'});
    db.user.belongsTo(db.companyRole, {foreignKey: "companyRoleId", sourceKey: 'id', as: 'companyRoleData'});
    db.user.hasOne(db.subscription, { foreignKey: 'userId', as: 'subscription'});
    
    // Simple Chat System associations
    db.user.hasMany(db.conversation, { foreignKey: 'clientId', as: 'clientConversations'});
    db.user.hasMany(db.conversation, { foreignKey: 'professionalId', as: 'professionalConversations'});
    db.user.hasMany(db.simpleMessage, { foreignKey: 'senderId', as: 'sentMessages'});

    // Team Management associations
    db.user.hasMany(db.team, { foreignKey: 'ownerId', as: 'ownedTeams'});
    db.user.hasMany(db.teamMember, { foreignKey: 'userId', as: 'teamMemberships'});

    // OTP associations
    db.user.hasMany(db.otp, { foreignKey: 'userId', as: 'otps'});

    db.user.addScope('companyRoleData',{
        include : {
            model : db.companyRole,
            attributes: ["id", "name"],
            required: false,
            as: 'companyRoleData'
        }
    })

    db.user.addScope('roleData',{
        include : {
            model : db.roles,
            attributes: ["id", "name"],
            required: true,
            as: 'roleData'
        }
    })

    db.user.addScope('designations',{
        include : {
            model: db.userDesignations,
            attributes :['designationId','priority'],
            include: {
                model: db.designations,
                attributes : ['id', 'name', 'key'],
                as : "designation"
            }
        }
    })

    db.user.addScope("FCMTokens", {
        include:{
            model: db.FCMToken,
            required: false,
        }
    })

    db.user.addScope("professionalProfile", {
        include:{
            model: db.professionalProfile,
            as: 'professionalProfile',
            required: false,
        }
    })




    db.user.addScope("users:own",{
        where:{
            email: {
                [db.Op.notLike] : `%@outsider.com%`
            }
        },
        required: true
    })
}

exports.subscriptionModel = (db) => {
    db.subscription.belongsTo(db.user, { foreignKey: 'userId', as: 'user' });
}

exports.chatModel = (db) => {
    db.chat.hasMany(db.chatUser, { foreignKey: 'chatId', sourceKey: 'id' });
    db.chat.hasMany(db.message, { foreignKey: 'chatId', sourceKey: 'id' });
    db.chat.hasMany(db.messageRecipient, { foreignKey: 'chatId', sourceKey: 'id' });
    db.chat.hasMany(db.chatLogs, { foreignKey: 'chatId' });
    db.chat.hasMany(db.note, { foreignKey: "chatId" });
    db.chat.hasMany(db.designationGroup,{ foreignKey: "chatId" });
    db.chat.addScope("chatUser",{
        include: {
            model: db.chatUser,
            where: {
                // isGhostChat: false,
            },
            attributes: [
                'id',
                'chatId',
                'userId',
                'isAdmin',
                'initialMessage',
                'createdAt'
            ],
            include: {
                model: db.user,
                where:{
                    isActive: true
                },
                attributes: USER_FIELDS,
                include: [{
                    model: db.userDesignations,
                    attributes: ['designationId'],
                    include: [{
                        model: db.designations,
                        attributes: ['name'],
                        as: "designation"
                    }],
                }],
                order: [['id', 'DESC']],
            },
        },
    })
    db.chat.addScope("lastMessage", {
        include: {
            model: db.message,
            attributes: ['id', 'message', 'subject', 'createdAt', 'sendBy', 'chatId', 'fileName', 'mediaType', 'isMessage', 'isDeleted', 'type'],
            include: [
                {
                    model: db.user,
                    attributes: ['id', 'fullName',],
                    as: 'sendByDetail'
                },
                {
                    model: db.messageRecipient,
                    attributes: ['id', 'messageId', 'recipientId', 'isRead'],
                    required: false
                },
            ],
            order: [['createdAt', 'DESC']],
            required: false,
            limit: 1
        },
    })

}

exports.chatUserModel = (db) => {
    db.chatUser.belongsTo(db.chat,  { foreignKey: 'chatId', sourceKey: 'id' })
    db.chatUser.belongsTo(db.user, { foreignKey: 'userId', sourceKey: 'id' });

    db.chatUser.addScope("user",{
        include:{
            model: db.user
        }
    })

    db.chatUser.addScope("userDesigntion",{
        include:{
            model: db.user,
            include: [
                {
                    model: db.userDesignations,
                    include:{
                        model: db.designations,
                        attributes: ["name"],
                        as: "designation"
                    }
                }
            ]
        }
    })

    db.chatUser.addScope("roles:isActive",{
        include:{
            model: db.user,
            where:{
                isActive: true
            },
            include: [
                {
                    model: db.userDesignations,
                    include:{
                        model: db.designations,
                        attributes: ["name"],
                        as: "designation"
                    },
                    required: false
                },
                {
                    model: db.roles,
                    as: "roleData",
                    required: false
                },
                {
                    model: db.companyRole,
                    as: "companyRoleData",
                    required: false
                }
            ]
        }
    })
    db.chatUser.addScope("user-Designation-role",{
        include:{
            model: db.user,
            include: [
                {
                    model: db.userDesignations,
                    include:{
                        model: db.designations,
                        attributes: ["name"],
                        as: "designation"
                    }
                },
                {
                    model: db.roles,
                    as: "roleData"
                }
            ]
        }
    })
}

exports.messageModel = (db) => {

    db.message.hasMany(db.messageRecipient, { foreignKey: 'messageId' });
    db.message.hasOne(db.importantMessage, { foreignKey: 'messageId' });
    db.message.belongsTo(db.chat, {foreignKey : 'chatId', sourceKey : 'id', as: 'userChat'})
    db.message.belongsTo(db.user, { foreignKey: 'sendBy', as: "sendByDetail" });
    db.message.hasMany(db.messageEmoji, { foreignKey: "messageId"});
    db.message.belongsTo(db.message, { foreignKey: 'quotedMessageId', sourceKey: 'id', as: 'quotedMessageDetail' });
    db.message.hasMany(db.message, { foreignKey: 'quotedMessageId', sourceKey: 'id', as: 'quotedMessageDetailData' });
    db.message.addScope("messageEmojis",{
        include:{
            attributes: ['userId', 'emojiCode'],
            model: db.messageEmoji,
            include: {
                attributes: ['id', 'fullName', 'profilePicture'],
                model: db.user,
                as: "userEmojiInfo",
                required: false
            },
            required: false
        }
    })

    db.message.addScope("getFCMTokenBySendBy",{
        include:{
            attributes: ['id'],
            model: db.user,
            include: {
                model: db.FCMToken,
                attributes:['deviceKey','userId'],
                required: true
            },
            as: "sendByDetail",
            required: true,
        }
    })

    db.message.addScope("sendByDetail",{
        include:{
            model: db.user,  
            attributes: ['id', 'profilePicture', 'fullName', 'mainDesignation'],
            include:{
                model: db.companyRole,
                as: "companyRoleData",
                required: false,
            },
            as: "sendByDetail",
            required: false
        }
    })

    db.message.addScope("userEmojiInfo",{
        include: {
            attributes: ['id', 'userId', 'emojiCode', 'messageId'],
            model: db.messageEmoji,
            include: {
                attributes: ['id', 'fullName', 'profilePicture'],
                model: db.user,
                as: "userEmojiInfo",
                required: false
            },
            required: false
        },
    })

    db.message.addScope("userChat",{
        include:{
            attributes: ['name','image', 'type'],
            model: db.chat,
            as: 'userChat',
            required: false,
        }
    })

    db.message.addScope("messageRecipient",{
        include: {
            model: db.messageRecipient, 
            attributes: ['recipientId', 'isRead'],
            required: false
        },
    })

    db.message.addScope("quotedMessageDetail",{
        include: {
            model: db.message,
            include: [
                {
                    model: db.user, 
                    as: "sendByDetail", 
                    attributes: ['id', 'fullName',  'mainDesignation'],
                    required: false
                },
                {
                    model : db.chat,
                    attributes : ['name'],
                    as : 'userChat',
                    required: false
                }
            ],
            as: "quotedMessageDetail",
            required: false
        },
    })

}

exports.messageRecipientModel = (db) => {
    db.messageRecipient.belongsTo(db.message, { foreignKey: 'messageId', sourceKey: 'id'});
    db.messageRecipient.belongsTo(db.user, { foreignKey: 'recipientId', sourceKey: 'id' });
}

exports.importantMessageModel = (db) => {
    db.importantMessage.belongsTo(db.message, { foreignKey: 'messageId', sourceKey: 'id' });
}

exports.designationsModel = (db) => {
    db.designations.belongsTo(db.user, { foreignKey: 'createdBy' });
    db.designations.hasMany(db.userDesignations, {foreignKey: 'designationId'});
    db.designations.hasMany(db.designationGroup,{foreignKey: "designationId"});

    db.designations.addScope("designationChatInfo", {
        include: {
            model: db.designationGroup,
            attributes: ["id", "designationId", "chatId"],
            include: {
                model: db.chat,
                attributes: ["id", "name", "type"],
                as: "designationChatInfo"
            }
        }
    })
}

exports.userDesignationsModel = (db) => {
    db.userDesignations.belongsTo(db.user, { foreignKey : 'userId', sourceKey : "id", as: 'assignDesignation' });
    db.userDesignations.belongsTo(db.designations, { foreignKey : 'designationId', sourceKey : "id", as: 'designation' });

}

exports.userLogsModel = (db) =>{
    db.userLogs.belongsTo(db.user, { foreignKey: "userId", as: "userLogs" })   
}

exports.logsModel = (db) =>{
    db.logs.belongsTo(db.user, { foreignKey: "userId", as: "logs"});
    db.logs.belongsTo(db.user, { foreignKey: "updatedBy", as: "updatedBylogs"});
}

exports.FCMTokenModel = (db) =>{
    db.FCMToken.belongsTo(db.user, { foreignKey: "userId", as: "FCMTokens" });  
}

exports.notesModel = (db) =>{
    db.note.belongsTo(db.user, { foreignKey: "createdBy",  as: "noteCreatedBy" });
    db.note.belongsTo(db.user, { foreignKey: "lastUpdatedBy",  as: "notelastUpdatedBy" });
    db.note.belongsTo(db.chat, { foreignKey: "chatId",  as: "chatNotes" });
}

exports.linkCategoryDesignationModel = (db) => {
    db.LinkCategoryDesignation.belongsTo(db.designations,{ foreignKey : 'designationId'});
    db.LinkCategoryDesignation.belongsTo(db.taskLabels,{ foreignKey : 'categoryId'});
}

exports.organizationModel = (db) => {

}
exports.messageEmojiModel = (db) => {
    db.messageEmoji.belongsTo(db.message, { foreignKey: "messageId", as: "messageEmojiInfo"});
    db.messageEmoji.belongsTo(db.user, { foreignKey: "userId", as: "userEmojiInfo"});
    db.messageEmoji.addScope("userEmojiInfo",{
        include: {
            attributes: ['id', 'fullName', 'profilePicture'],
            model: db.user,
            as: "userEmojiInfo",
            required: false
        },
    })
}

exports.companyRoleModel = (db) => {
    db.companyRole.hasMany(db.user, { foreignKey: "companyRoleId"})
}
exports.designationGroupModel = (db) => {
    db.designationGroup.belongsTo(db.designations, { foreignKey: "designationId", sourceKey: "id", as: "designationGroupInfo", onDelete: "CASCADE"});
    db.designationGroup.belongsTo(db.chat, { foreignKey: "chatId", sourceKey: "id", as: "designationChatInfo", onDelete: "CASCADE"});
}

// Professional Profile Associations
exports.professionalProfileModel = (db) => {
    // Professional profile belongs to user
    db.professionalProfile.belongsTo(db.user, {
        foreignKey: 'userId',
        as: 'user'
    });

    // Professional profile has many services
    db.professionalProfile.hasMany(db.professionalServices, {
        foreignKey: 'professionalId',
        as: 'services'
    });

    // Professional profile has many portfolio items
    db.professionalProfile.hasMany(db.professionalPortfolio, {
        foreignKey: 'professionalId',
        as: 'portfolio'
    });

    // Professional profile has many reviews
    db.professionalProfile.hasMany(db.professionalReviews, {
        foreignKey: 'professionalId',
        as: 'reviews'
    });

    // Professional profile has many bookings
    db.professionalProfile.hasMany(db.professionalBookings, {
        foreignKey: 'professionalId',
        as: 'bookings'
    });

    // Professional profile has many payment records through bookings
    db.professionalProfile.hasMany(db.bookingPayments, {
        foreignKey: 'professionalId',
        as: 'payments'
    });

    // Professional profile has many availability slots
    db.professionalProfile.hasMany(db.professionalAvailability, {
        foreignKey: 'professionalId',
        as: 'availability'
    });


    // Many-to-many relationship with categories through junction table
    db.professionalProfile.belongsToMany(db.category, {
        through: db.professionalCategory,
        foreignKey: 'professionalId',
        otherKey: 'categoryId',
        as: 'categories'
    });

    // Junction table association
    db.professionalProfile.hasMany(db.professionalCategory, { 
        foreignKey: 'professionalId',
        as: 'professionalCategories'
    });

    // Scopes for professional profile
    db.professionalProfile.addScope('user', {
        include: {
            model: db.user,
            attributes: ['id', 'fullName', 'email', 'profilePicture'],
            as: 'user',
            required: true
        }
    });

    db.professionalProfile.addScope('services', {
        include: {
            model: db.professionalServices,
            attributes: ['id', 'serviceName', 'price',  'isActive'],
            as: 'services',
            required: false
        }
    });

    db.professionalProfile.addScope('portfolio', {
        include: {
            model: db.professionalPortfolio,
            attributes: ['id', 'title', 'mediaUrl', 'mediaType', 'isVisible'],
            as: 'portfolio',
            where: { isVisible: true },
            required: false
        }
    });

    db.professionalProfile.addScope('reviews', {
        include: {
            model: db.professionalReviews,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            as: 'reviews',
            include: {
                model: db.user,
                attributes: ['id', 'fullName', 'profilePicture'],
                as: 'client'
            },
            required: false
        }
    });

    db.professionalProfile.addScope('categories', {
        include: {
            model: db.category,
            attributes: ['id', 'name', 'slug', 'icon', 'color'],
            as: 'categories',
            through: { attributes: ['isPrimary'] },
            required: false
        }
    });
};

exports.professionalServicesModel = (db) => {
    // Service belongs to professional profile
    db.professionalServices.belongsTo(db.professionalProfile, {
        foreignKey: 'professionalId',
        as: 'professional'
    });

    // Service has many bookings
    db.professionalServices.hasMany(db.professionalBookings, {
        foreignKey: 'serviceId',
        as: 'bookings'
    });
};

exports.professionalPortfolioModel = (db) => {
    // Portfolio belongs to professional profile
    db.professionalPortfolio.belongsTo(db.professionalProfile, {
        foreignKey: 'professionalId',
        as: 'professional'
    });
};

exports.professionalReviewsModel = (db) => {
    // Review belongs to professional profile
    db.professionalReviews.belongsTo(db.professionalProfile, {
        foreignKey: 'professionalId',
        as: 'professional'
    });

    // Review belongs to client (user)
    db.professionalReviews.belongsTo(db.user, {
        foreignKey: 'clientId',
        as: 'client'
    });

    // Review belongs to booking
    db.professionalReviews.belongsTo(db.professionalBookings, {
        foreignKey: 'bookingId',
        as: 'booking'
    });
};

exports.professionalBookingsModel = (db) => {
    // Booking belongs to professional profile
    db.professionalBookings.belongsTo(db.professionalProfile, {
        foreignKey: 'professionalId',
        as: 'professional'
    });

    // Booking belongs to client (user)
    db.professionalBookings.belongsTo(db.user, {
        foreignKey: 'clientId',
        as: 'client'
    });

    // Booking belongs to service
    db.professionalBookings.belongsTo(db.professionalServices, {
        foreignKey: 'serviceId',
        as: 'service'
    });

    // Booking has one review
    db.professionalBookings.hasOne(db.professionalReviews, {
        foreignKey: 'bookingId',
        as: 'review'
    });

    // Booking has many payment records
    db.professionalBookings.hasMany(db.bookingPayments, {
        foreignKey: 'bookingId',
        as: 'payments'
    });

    // Scopes for professional bookings
    db.professionalBookings.addScope('professional', {
        include: {
            model: db.professionalProfile,
            attributes: ['id', 'location',],
            as: 'professional',
            include: {
                model: db.user,
                attributes: ['id', 'fullName', 'email', 'profilePicture'],
                as: 'user'
            },
            required: true
        }
    });

    db.professionalBookings.addScope('client', {
        include: {
            model: db.user,
            attributes: ['id', 'fullName', 'email', 'profilePicture'],
            as: 'client',
            required: true
        }
    });

    db.professionalBookings.addScope('service', {
        include: {
            model: db.professionalServices,
            attributes: ['id', 'serviceName', 'price', 'currency'],
            as: 'service',
            required: true
        }
    });

    db.professionalBookings.addScope('review', {
        include: {
            model: db.professionalReviews,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            as: 'review',
            required: false
        }
    });
};

//realtion for booking payments with professional bookings
exports.bookingPaymentModel = (db) => {
    // Payment belongs to booking
    db.bookingPayments.belongsTo(db.professionalBookings, {
        foreignKey: 'bookingId',
        as: 'booking'
    });

    // Payment belongs to client (user)
    db.bookingPayments.belongsTo(db.user, {
        foreignKey: 'clientId',
        as: 'client'
    });

    // Payment belongs to professional profile
    db.bookingPayments.belongsTo(db.professionalProfile, {
        foreignKey: 'professionalId',
        as: 'professional'
    });
}


exports.professionalAvailabilityModel = (db) => {
    // Availability belongs to professional profile
    db.professionalAvailability.belongsTo(db.professionalProfile, {
        foreignKey: 'professionalId',
        as: 'professional'
    });
};



// Category model associations
exports.categoryModel = (db) => {
    // Many-to-many relationship with professionals through junction table
    db.category.belongsToMany(db.professionalProfile, {
        through: db.professionalCategory,
        foreignKey: 'categoryId',
        otherKey: 'professionalId',
        as: 'professionals'
    });
    
    db.category.hasMany(db.professionalCategory, { foreignKey: 'categoryId' });
    
    // Scopes for category queries
    db.category.addScope('active', {
        where: { isActive: true, isDeleted: false }
    });
};

// Professional Category junction model associations
exports.professionalCategoryModel = (db) => {
    db.professionalCategory.belongsTo(db.professionalProfile, { foreignKey: 'professionalId', as: 'professional' });
    db.professionalCategory.belongsTo(db.category, { foreignKey: 'categoryId', as: 'category' });
};

// Conversation model associations (Simple Chat System)
exports.conversationModel = (db) => {
    // A conversation has many simple messages
    db.conversation.hasMany(db.simpleMessage, {
        foreignKey: 'conversationId',
        as: 'messages'
    });
    
    // A conversation belongs to two users (client and professional)
    db.conversation.belongsTo(db.user, {
        foreignKey: 'clientId',
        as: 'client'
    });
    
    db.conversation.belongsTo(db.user, {
        foreignKey: 'professionalId', 
        as: 'professional'
    });

    // Add scopes for conversation queries
    db.conversation.addScope('active', {
        where: { isActive: true }
    });

    db.conversation.addScope('withUsers', {
        include: [
            {
                model: db.user,
                as: 'client',
                attributes: ['id', 'fullName', 'profilePicture']
            },
            {
                model: db.user,
                as: 'professional',
                attributes: ['id', 'fullName', 'profilePicture']
            }
        ]
    });

    db.conversation.addScope('withLastMessage', {
        include: [
            {
                model: db.simpleMessage,
                as: 'messages',
                limit: 1,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: db.user,
                        as: 'sender',
                        attributes: ['id', 'fullName']
                    }
                ]
            }
        ]
    });
};

// Simple Message model associations (Simple Chat System)
exports.simpleMessageModel = (db) => {
    // A message belongs to a conversation
    db.simpleMessage.belongsTo(db.conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
    });
    
    // A message belongs to a sender (user)
    db.simpleMessage.belongsTo(db.user, {
        foreignKey: 'senderId',
        as: 'sender'
    });

    // Add scopes for message queries
    db.simpleMessage.addScope('withSender', {
        include: [
            {
                model: db.user,
                as: 'sender',
                attributes: ['id', 'fullName', 'profilePicture']
            }
        ]
    });

    db.simpleMessage.addScope('withConversation', {
        include: [
            {
                model: db.conversation,
                as: 'conversation',
                attributes: ['id', 'clientId', 'professionalId']
            }
        ]
    });
};

// OTP model associations
exports.otpModel = (db) => {
    // OTP belongs to user
    db.otp.belongsTo(db.user, {
        foreignKey: 'userId',
        as: 'user'
    });
};

// Team Management model associations
exports.teamModel = (db) => {
    // Team belongs to owner (user)
    db.team.belongsTo(db.user, {
        foreignKey: 'ownerId',
        as: 'owner'
    });
    
    // Team has many members
    db.team.hasMany(db.teamMember, {
        foreignKey: 'teamId',
        as: 'members'
    });
    
    // Add scopes for team queries
    db.team.addScope('withMembers', {
        include: [
            {
                model: db.teamMember,
                as: 'members',
                where: { isActive: true },
                include: [
                    {
                        model: db.user,
                        as: 'user',
                        attributes: ['id', 'fullName', 'userName', 'profilePicture']
                    }
                ]
            }
        ]
    });
    
    db.team.addScope('withOwner', {
        include: [
            {
                model: db.user,
                as: 'owner',
                attributes: ['id', 'fullName', 'userName', 'profilePicture']
            }
        ]
    });
};

// Team Member model associations
exports.teamMemberModel = (db) => {
    // Team member belongs to team
    db.teamMember.belongsTo(db.team, {
        foreignKey: 'teamId',
        as: 'team'
    });
    
    // Team member belongs to user
    db.teamMember.belongsTo(db.user, {
        foreignKey: 'userId',
        as: 'user'
    });
};