module.exports = function customErrorHandler(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'develop' ? err : {};
    if (err && err.status) {
        // console.log("Response Status: ", err.response.status);
        // console.log("Response Data: ", err.response.data);
        // console.log("URL: ", err.config.url);
        // const message = err.response.data;
        // console.log('err :>> ', err);
        let errorObj = { message: err.message, data: err.data };
        // if (message) { errorObj.message = message; };
        switch (err.status) {
            case 401:
                return res.unAuthorized(errorObj);
            case 400:
                return res.badRequest(errorObj);
            case 403:
                return res.forbidden(errorObj);
            case 404:
                return res.recordNotFound(errorObj);
            case 422:
                return res.validationError(errorObj);
            default:
                return res.internalServerError(errorObj);
        }
    } else if (err && err.status && err.message) {
        return res.status(err.status).json({ message: err.message, data: {} });
    } else {
        return res.internalServerError({ message: err.message, data: {} });
    }
    res.status(err.status || 500);
    res.render('error');
}