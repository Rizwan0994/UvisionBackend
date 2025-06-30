/**
 * responseHandler.js
 * @description :: exports all handlers for response format.
 */
const responseBody = require('./index');
const responseCode = require('./responseCode');
const encryptResponse = require('../../middleware/encryptResponse');

/**
 *
 * @param {obj} req : request from controller.
 * @param {obj} res : response from controller.
 * @param {*} next : executes the middleware succeeding the current middleware.
 */
const responseHandler = (req, res, next) => {
  res.success = (data = {}) => {
    res.status(responseCode.success).json(encryptResponse(responseBody.success(data)));
  };
  res.failure = (data = {}) => {
    res.status(responseCode.success).json(encryptResponse(responseBody.failure(data)));
  };
  res.internalServerError = (data = {}) => {
    res.status(responseCode.internalServerError).json(encryptResponse(responseBody.internalServerError(data)));
  };
  res.badRequest = (data = {}) => {
    res.status(responseCode.badRequest).json(encryptResponse(responseBody.badRequest(data)));
  };
  res.recordNotFound = (data = {}) => {
    res.status(responseCode.success).json(encryptResponse(responseBody.recordNotFound(data)));
  };
  res.validationError = (data = {}) => {
    res.status(responseCode.validationError).json(encryptResponse(responseBody.validationError(data)));
  };
  res.unAuthorized = (data = {}) => {
    res.status(responseCode.unAuthorized).json(encryptResponse(responseBody.unAuthorized(data)));
  };
  next();
};

module.exports = responseHandler;
