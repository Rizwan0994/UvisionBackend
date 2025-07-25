module.exports = Object.freeze({
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
    BCRYPT_PASSWORD_VALUE: "UVISION",
    GHOST_MODE_KEY: "GHo$T_@M0dE_rOoM",
    RESPONSE_SECRET_KEY: "UVISION_REPONSE_KEY@123",
    TEMP_PASSWORD: "123123123",
})