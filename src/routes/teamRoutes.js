'use strict';

const router = require('express').Router();
const { catchAsync } = require('../util/catchAsync');
const { jwtValidation } = require('../middleware/authentication');
const {
    createTeam,
    addExistingProfessional,
    removeMember,
    getTeamDetails,
    getUserTeam,
    findProfessionalByEmail
} = require('../controllers/teamController');

/**
 * Create a new team
 * POST /api/teams
 * Body: { name: string }
 */
router.post('/', jwtValidation, catchAsync(async function _createTeam(req, res) {
    const data = await createTeam(req.body, req.loginUser);
    res.success(data);
}));

/**
 * Add existing professional to team
 * POST /api/teams/:id/members
 * Body: { professionalId: number }
 */
router.post('/:id/members', jwtValidation, catchAsync(async function _addMember(req, res) {
    const data = await addExistingProfessional({ ...req.body, teamId: req.params.id }, req.loginUser);
    res.success(data);
}));

/**
 * Remove member from team
 * DELETE /api/teams/:id/members/:memberId
 */
router.delete('/:id/members/:memberId', jwtValidation, catchAsync(async function _removeMember(req, res) {
    const data = await removeMember({ teamId: req.params.id, memberId: req.params.memberId }, req.loginUser);
    res.success(data);
}));

/**
 * Get team details
 * GET /api/teams/:id
 */
router.get('/:id', jwtValidation, catchAsync(async function _getTeamDetails(req, res) {
    const data = await getTeamDetails({ teamId: req.params.id }, req.loginUser);
    res.success(data);
}));

/**
 * Get user's team
 * GET /api/teams/user/me
 */
router.get('/user/me', jwtValidation, catchAsync(async function _getUserTeam(req, res) {
    const data = await getUserTeam(req.loginUser);
    res.success(data);
}));

/**
 * Find professional by email to add to team
 * POST /api/teams/:id/find-by-email
 * Body: { email: string }
 */
router.post('/:id/find-by-email', jwtValidation, catchAsync(async function _findByEmail(req, res) {
    const data = await findProfessionalByEmail({ ...req.body, teamId: req.params.id }, req.loginUser);
    res.success(data);
}));

module.exports = router;
