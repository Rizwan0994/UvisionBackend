'use strict';

const router = require('express').Router();
const { catchAsync } = require('../util/catchAsync');
const { jwtValidation } = require('../middleware/authentication');
const {
    createEvent,
    assignMembers,
    addTask,
    getTeamEvents,
    updateEventStatus,
    getEventDetails
} = require('../controllers/teamEventController');

/**
 * Create a new team event
 * POST /api/team-events
 * Body: { teamId: number, eventName: string, eventDate: string, clientId?: number }
 */
router.post('/', jwtValidation, catchAsync(async function _createEvent(req, res) {
    const data = await createEvent(req.body, req.loginUser);
    res.success(data);
}));

/**
 * Assign team members to event
 * POST /api/team-events/:id/assign
 * Body: { memberIds: number[] }
 */
router.post('/:id/assign', jwtValidation, catchAsync(async function _assignMembers(req, res) {
    const data = await assignMembers({ ...req.body, eventId: req.params.id }, req.loginUser);
    res.success(data);
}));

/**
 * Add task to event
 * POST /api/team-events/:id/tasks
 * Body: { title: string, description?: string, assignedTo?: number, dueDate?: string, priority?: string }
 */
router.post('/:id/tasks', jwtValidation, catchAsync(async function _addTask(req, res) {
    const data = await addTask({ ...req.body, eventId: req.params.id }, req.loginUser);
    res.success(data);
}));

/**
 * Get team events
 * GET /api/teams/:teamId/events
 */
router.get('/teams/:teamId', jwtValidation, catchAsync(async function _getTeamEvents(req, res) {
    const data = await getTeamEvents({ teamId: req.params.teamId }, req.loginUser);
    res.success(data);
}));

/**
 * Update event status
 * PUT /api/team-events/:id/status
 * Body: { status: string }
 */
router.put('/:id/status', jwtValidation, catchAsync(async function _updateEventStatus(req, res) {
    const data = await updateEventStatus({ ...req.body, eventId: req.params.id }, req.loginUser);
    res.success(data);
}));

/**
 * Get event details
 * GET /api/team-events/:id
 */
router.get('/:id', jwtValidation, catchAsync(async function _getEventDetails(req, res) {
    const data = await getEventDetails({ eventId: req.params.id }, req.loginUser);
    res.success(data);
}));

module.exports = router;

