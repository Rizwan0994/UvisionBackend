const responseStatus = require('./responseStatus');

module.exports = {
  success: (data = {}) => ({
    status: 1,
    response: responseStatus.success,
    message: data.message || 'Your request is successfully executed',
    data: data.data && Object.keys(data.data).length ? data.data : null,
    ...data
  }),

  failure: (data = {}) => ({
    status: 0,
    response: responseStatus.failure,
    message: data.message || 'Some error occurred while performing action.',
    data: data.data && Object.keys(data.data).length ? data.data : null,
  }),

  internalServerError: (data = {}) => ({
    status: 0,
    response: responseStatus.serverError,
    message: data.message || 'Internal server error.',
    data: data.data && Object.keys(data.data).length ? data.data : null,
  }),

  badRequest: (data = {}) => ({
    status: 0,
    response: responseStatus.badRequest,
    message: data.message || 'Request parameters are invalid or missing.',
    data: data.data && Object.keys(data.data).length ? data.data : null,
  }),

  recordNotFound: (data = {}) => ({
    status: 0,
    response: responseStatus.recordNotFound,
    message: data.message || 'Record(s) not found with specified criteria.',
    data: data.data && Object.keys(data.data).length ? data.data : null,
  }),

  validationError: (data = {}) => ({
    status: 0,
    response: responseStatus.validationError,
    message: data.message || `Invalid Data, Validation Failed.`,
    data: data.data && Object.keys(data.data).length ? data.data : null,
  }),

  unAuthorized: (data = {}) => ({
    status: 0,
    response: responseStatus.unauthorized,
    message: data.message || 'You are not authorized to access the request',
    data: data.data && Object.keys(data.data).length ? data.data : null,
  }),
};
