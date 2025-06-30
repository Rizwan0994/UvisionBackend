module.exports = Object.freeze({
    MIME_TYPES: {
        image: ["image/png", "image/jpeg", "image/jpg", "image/jfif", "image/webp"],
        video: ["video/mp4", "video/mp3", "video/mkv"],
        audio: ["audio/mpeg"],
        doc: ["application/pdf", "application/docx", "application/doc", "application/text", "application/html", "application/csv"]
    },
    CHAT_TYPE: {
        PRIVATE: 'private',
        GROUP: 'group',
    },
    NOTE_TAG: {
        PERSONAL: 'personal',
        IMPORTANT: 'important',
        WORK: 'work',
        FAVOURITE: 'favourite',
    },
    CHAT_LOGS: {
        CHAT_CREATED: 'chat_created',
        USER_ADDED: 'user_added',
        USER_REMOVED: 'user_removed',
        USER_LEFT: 'user_left',
        CHAT_CREATED: 'chat_created'
    },
    SCHEDULE_REPEAT: {
        NONE: 0,
        DAY: 1,
        WEEK: 7,
        MONTH: 30,
        YEAR: 365
    },
    TEMPLATE_STATUS: {
        PENDING: 'pending',
        STARTED: 'started',
        FINISHED: 'finished',
    },
    CHAT_LIST_USER_FIELDS :  ["id", "name", "email", "profilePicture", "isDeleted", "profileStatus", "createdAt", "updatedAt"],
    TEMPLATE_TYPE: {
        PUBLIC: "public",
        PRIVATE: "private"
    },
})