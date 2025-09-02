'use strict';

const {
    team: TeamModel,
    teamMember: TeamMemberModel,
    user: UserModel,
    professionalProfile: ProfessionalProfileModel,
    Op
} = require('../models');
const createError = require('http-errors');

/**
 * Create a new team
 */
exports.createTeam = async (data, loginUser) => {
    try {
        const { name } = data;
        const ownerId = loginUser.id;

        // Check if user already has a team
        const existingTeam = await TeamModel.findOne({
            where: { ownerId, isActive: true }
        });

        if (existingTeam) {
            throw createError(400, 'You already have a team. Only one team per user is allowed.');
        }

        // Create team
        const team = await TeamModel.create({
            name,
            ownerId,
            maxMembers: 4
        });

        // Add owner as first member
        await TeamMemberModel.create({
            teamId: team.id,
            userId: ownerId,
            role: 'owner'
        });

        // Fetch team with members
        const teamWithMembers = await TeamModel.scope(['withMembers', 'withOwner']).findByPk(team.id);

        return {
            status: 1,
            data: teamWithMembers,
            message: 'Team created successfully'
        };

    } catch (error) {
        console.error('Error in createTeam:', error);
        throw error;
    }
};

/**
 * Add existing professional to team
 */
exports.addExistingProfessional = async (data, loginUser) => {
    try {
        const { teamId, professionalId } = data;
        const ownerId = loginUser.id;

        // Verify team ownership
        const team = await TeamModel.findOne({
            where: { id: teamId, ownerId, isActive: true }
        });

        if (!team) {
            throw createError(404, 'Team not found or access denied');
        }

        // Check if professional is already in team
        const existingMember = await TeamMemberModel.findOne({
            where: { teamId, userId: professionalId, isActive: true }
        });

        if (existingMember) {
            throw createError(400, 'Professional is already a member of this team');
        }

        // Check team member limit
        const memberCount = await TeamMemberModel.count({
            where: { teamId, isActive: true }
        });

        if (memberCount >= team.maxMembers) {
            throw createError(400, `Team is full. Maximum ${team.maxMembers} members allowed.`);
        }

        // Verify professional exists and has active profile
        const professional = await UserModel.findOne({
            where: { id: professionalId },
            include: [{
                model: ProfessionalProfileModel,
                as: 'professionalProfile',
                where: { isActive: true, isDeleted: false },
                required: true
            }]
        });

        if (!professional) {
            throw createError(404, 'Professional not found or profile inactive');
        }

        // Add member to team
        await TeamMemberModel.create({
            teamId,
            userId: professionalId,
            role: 'member'
        });

        // Fetch updated team
        const updatedTeam = await TeamModel.scope(['withMembers', 'withOwner']).findByPk(teamId);

        return {
            status: 1,
            data: updatedTeam,
            message: 'Professional added to team successfully'
        };

    } catch (error) {
        console.error('Error in addExistingProfessional:', error);
        throw error;
    }
};

/**
 * Remove member from team
 */
exports.removeMember = async (data, loginUser) => {
    try {
        const { teamId, memberId } = data;
        const ownerId = loginUser.id;

        // Verify team ownership
        const team = await TeamModel.findOne({
            where: { id: teamId, ownerId, isActive: true }
        });

        if (!team) {
            throw createError(404, 'Team not found or access denied');
        }

        // Cannot remove owner
        if (memberId === ownerId) {
            throw createError(400, 'Cannot remove team owner');
        }

        // Find and remove member
        const member = await TeamMemberModel.findOne({
            where: { teamId, userId: memberId, isActive: true }
        });

        if (!member) {
            throw createError(404, 'Member not found in team');
        }

        await member.update({ isActive: false });

        // Fetch updated team
        const updatedTeam = await TeamModel.scope(['withMembers', 'withOwner']).findByPk(teamId);

        return {
            status: 1,
            data: updatedTeam,
            message: 'Member removed from team successfully'
        };

    } catch (error) {
        console.error('Error in removeMember:', error);
        throw error;
    }
};

/**
 * Get team details
 */
exports.getTeamDetails = async (data, loginUser) => {
    try {
        const { teamId } = data;
        const userId = loginUser.id;

        // Verify user is team member
        const teamMember = await TeamMemberModel.findOne({
            where: { teamId, userId, isActive: true }
        });

        if (!teamMember) {
            throw createError(404, 'Team not found or access denied');
        }

        // Fetch team with members
        const team = await TeamModel.scope(['withMembers', 'withOwner']).findByPk(teamId);

        if (!team) {
            throw createError(404, 'Team not found');
        }

        return {
            status: 1,
            data: team,
            message: 'Team details retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getTeamDetails:', error);
        throw error;
    }
};

/**
 * Get user's team
 */
exports.getUserTeam = async (loginUser) => {
    try {
        const userId = loginUser.id;

        // First check if user owns a team
        let team = await TeamModel.scope(['withMembers', 'withOwner']).findOne({
            where: { ownerId: userId, isActive: true }
        });

        // If not owner, check if user is a member
        if (!team) {
            const teamMembership = await TeamMemberModel.findOne({
                where: { userId, isActive: true },
                include: [{
                    model: TeamModel,
                    as: 'team',
                    where: { isActive: true }
                }]
            });

            if (teamMembership) {
                team = await TeamModel.scope(['withMembers', 'withOwner']).findByPk(teamMembership.team.id);
            }
        }

        if (!team) {
            return {
                status: 1,
                data: null,
                message: 'No team found'
            };
        }

        return {
            status: 1,
            data: team,
            message: 'Team retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getUserTeam:', error);
        throw error;
    }
};

/**
 * Find professional by email to add to team
 */
exports.findProfessionalByEmail = async (data, loginUser) => {
    try {
        const { email, teamId } = data;
        const userId = loginUser.id;

        // Verify team ownership
        const team = await TeamModel.findOne({
            where: { id: teamId, ownerId: userId, isActive: true }
        });

        if (!team) {
            throw createError(404, 'Team not found or access denied');
        }

        // Get current team members
        const currentMembers = await TeamMemberModel.findAll({
            where: { teamId, isActive: true },
            attributes: ['userId']
        });

        const currentMemberIds = currentMembers.map(m => m.userId);

        // Find professional by email
        const professional = await ProfessionalProfileModel.findOne({
            where: { isActive: true, isDeleted: false },
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'fullName', 'userName', 'profilePicture', 'email'],
                    required: true,
                    where: { 
                        email: email.toLowerCase(),
                        id: {
                            [Op.notIn]: currentMemberIds,
                            [Op.ne]: userId // Exclude team owner
                        }
                    }
                }
            ]
        });

        if (!professional) {
            return {
                status: 0,
                data: null,
                message: 'No professional found with this email address'
            };
        }

        return {
            status: 1,
            data: professional,
            message: 'Professional found successfully'
        };

    } catch (error) {
        console.error('Error in findProfessionalByEmail:', error);
        throw error;
    }
};
