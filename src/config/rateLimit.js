module.exports = Object.freeze({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 200, // Limit each IP to 300 requests per `window` (here, per 1 minutes)
    message: 'Too many accounts created from this IP, please try again after an hour',
    statusCode: 429,
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})