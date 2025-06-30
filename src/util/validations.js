const { body, validationResult } = require("express-validator");
const printError = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(417).json({ errors: errors.array() });
    next();
}





