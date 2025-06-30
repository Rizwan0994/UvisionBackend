module.exports = Object.freeze({
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
    ROLE: {
        SUPER_ADMIN: "superAdmin",
        ADMIN: "admin",
        USER: "user"
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
    PERMISSION_TO_DISPLAY :["superAdmin","admin"],
    USER_FIELDS : ["id", "name", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "companyName", "fontSize", "mainDesignation", 'lastSeen', 'extension', 'chatWallpaper', 'keywords', 'about', 'isSilentMode', 'isRoutineNotificationMute', 'isEmergencyNotificationMute','isUrgentNotificationMute' ],
    USER_FIELDS_FORMAT :{
        "superAdmin" : ["id", "name","firstName", "lastName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "companyName", "fontSize", "mainDesignation", 'lastSeen', 'extension', 'chatWallpaper', 'keywords', 'about', 'ghostUser', 'isGhostActive', 'isSilentMode', 'isRoutineNotificationMute', 'isEmergencyNotificationMute','isUrgentNotificationMute', 'taskAlertTimer'],
        "user" : ["id", "name","firstName", "lastName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "companyName", "fontSize", "mainDesignation", 'lastSeen', 'extension', 'chatWallpaper', 'keywords', 'about', 'isSilentMode', 'isRoutineNotificationMute', 'isEmergencyNotificationMute','isUrgentNotificationMute', 'taskAlertTimer' ],
        "admin" : ["id", "name","firstName", "lastName", "email", "role", "isEmailVerified", "profilePicture", "isDeleted", "lastSeen", "profileStatus", "isActive", "phone", "address", "createdAt", "updatedAt", "companyName", "fontSize", "mainDesignation", 'lastSeen', 'extension', 'chatWallpaper', 'keywords', 'about', 'isSilentMode', 'isRoutineNotificationMute', 'isEmergencyNotificationMute','isUrgentNotificationMute',  'taskAlertTimer' ]
    },
    TEMP_PASSWORD: "123123123",

})