'use strict';
module.exports = Object.freeze({
    MIME_TYPES: {
        image: ["image/png", "image/jpeg", "image/jpg", "image/jfif", "image/webp"],
        video: ["video/mp4", "video/mp3", "video/mkv"],
        audio: ["audio/mpeg"],
        doc: ["application/pdf", "application/docx", "application/doc", "application/text", "application/html", "application/csv"]
    },
    OK_STATUS: 200,
    CREATE: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    MEDIA_ERROR_STATUS: 415,
    FORBIDDEN_REQUEST: 403,
    VALIDATION_FAILURE_STATUS: 417,
    CONFLICT: 409,
    DATABASE_ERROR_STATUS: 422,
    INTERNAL_SERVER_ERROR: 500,
    WARNING:299,
    JWT_TOKEN_EXPIRED_TIME: '365d',
    JWT_USER_TOKEN_EXPIRED_TIME: '1d',
    // JWT_TOKEN_EXPIRED_TIME: '10s',
    JWT_SECRET_KEY: 'SecReT@123',
    PASSWORD_HASH: 12,
    JWT_VERIFICATION_EMAIL_EXPIRED_TIME : '2h',
    JWT_VERIFICATION_EMAIL_SECRET_KEY : 'VeriEm@il',
    JWT_VERIFICATION_EMAIL_HASH : 8,
    CHAT_TYPE: {
        PRIVATE: 'private',
        GROUP: 'group',
    },
    BCRYPT_PASSWORD_VALUE: "UVISION",
    FILTER_TASK_TYPE: {
		ALL: "all",
		CREATOR: "creator",
		ASSIGNEE: "assign",
        GROUP_TASK: "tasks"
	},
    
    MESSAGE_TYPE: {
        URGENT: 'urgent',
        EMERGENCY: 'emergency',
        ROUTINE: 'routine',
        CHAT_LOG: 'chat_log',
    },
    TASK_TYPE: {
        URGENT: 'urgent',
        EMERGENCY: 'emergency',
        ROUTINE: 'routine',
    },
    TASK_STATUS: {
        PENDING: 'pending',
        STARTED: 'started',
        PAUSED: 'paused',
        FINISHED: 'finished',
    },
    PROFILE_STATUS: {
        WORKING: 'working',
        BUSY: 'busy',
        ONLINE: 'online',
        OFFLINE: 'offline',
        VACATION: 'vacation',
        BREAK: 'break',
        ONCALL: 'oncall',
        AVAILABLE: 'available'
    },
    NOTE_TAG: {
        PERSONAL: 'personal',
        IMPORTANT: 'important',
        WORK: 'work',
        FAVOURITE: 'favourite',
    },
    SOCKET_EVENTS: {
        EMIT_GROUP_MESSAGE: "emitGroupMessage",
        EMIT_JOIN_ROOM: "emitJoinRoom",
        CONNECT: "connection",
        DISCONNECT: "disconnect",
        SOCKET_ERROR: "onSocketError",
        ON_NEW_GROUP_MESSAGE: "onNewGroupMessage",
        EMIT_DELETE_GROUP: "emitDeleteGroup",
        ON_DELETE_GROUP: "onDeleteGroup",
    },
    MESSAGE_TAG: {
        CC: 'cc',
        BCC: 'bcc',
        MESSAGE: 'message'
    },
    LOGS: {
        CLOCKIN: "clockin",
        CLOCKOUT: "clockout",
        OUT_FOR_BREAK: "outForBreak",
        BACK_FROM_BREAK: "backFromBreak",
        ON_CALL_START: "callStart",
        ON_CALL_END: "callEnd",
        STARTED: "started",
        ENDED: "ended",
        CREATE: "create",
        UPDATE: "update",
        DELETE: "delete",
        DOWNLOAD: "download"
    },
    ROLE: {
        SUPER_ADMIN: "superAdmin",
        USER: "user"
    },
    ISSUE_STATUS: {
        OPEN: 'open',
        RESOLVED: 'resolved',
        REOPEN: 'reopen'
    },
    CHAT_LOGS: {
        CHAT_CREATED: 'chat_created',
        USER_ADDED: 'user_added',
        USER_REMOVED: 'user_removed',
        USER_LEFT: 'user_left',
        CHAT_CREATED: 'chat_created'
    },
    ISSUE_ATTACHMENT_TYPE :{
        CREATOR : "creator",
        ASSIGNEE : "assignee"
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
    PERMISSION_TO_DISPLAY :["superAdmin","admin"],
    USER_FIELDS : ["id", "fullName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "mainDesignation", "isSilentMode" ],
    USER_FIELDS_FORMAT :{
        "superAdmin" : ["id", "fullName", "lastName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "mainDesignation", "isSilentMode"],
        "user" : ["id", "fullName", "lastName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "mainDesignation", "isSilentMode"],
        "admin" : ["id", "fullName", "lastName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "mainDesignation", "isSilentMode"]
    },
    CHAT_LIST_USER_FIELDS :  ["id", "fullName", "email", "profilePicture", "isDeleted", "profileStatus", "createdAt", "updatedAt"],
    MESSAGE_LIMIT_SEARCH : 10,
    RECORD_DISPLAY_LIMIT: 20,
    SERVICE : {
        EMAIL : true
    },
    DISPLAY_RECORDS : 10,
    CHAT_LIST_RECORDS : 10,
    THREAD_TYPE : {
        PARENT: "parent",
        CHILD: "child"
    },
    GHOST_MODE_KEY: "GHo$T_@M0dE_rOoM",



    TEMPLATE_TYPE: {
        PUBLIC: "public",
        PRIVATE: "private"
    },

    NOTES_VISIBILITY : {
        PUBLIC: "public",
        PRIVATE: "private" ,
        PERSONAL:"personal"
    },
    CRON_STATUS:{
        RUNNING: "RUNNING",
        COMPLETED: "COMPLETED"
    },
    // TASK_TYPE : {
    //     TEAM: "team",
    //     SINGLE: "single",
    //     DEPARTMENT: "dept",
    // }
});