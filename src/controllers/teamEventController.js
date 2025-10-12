'use strict';

const {
    teamEvent: TeamEventModel,
    eventTask: EventTaskModel,
    team: TeamModel,
    teamMember: TeamMemberModel,
    user: UserModel,
    Op
} = require('../models');
const createError = require('http-errors');

/**
 * Create a new team event
 */
exports.createEvent = async (data, loginUser) => {
    try {
        const { teamId, eventName, eventDate, clientId } = data;
        const createdBy = loginUser.id;

        // Verify team ownership
        const team = await TeamModel.findOne({
            where: { id: teamId, ownerId: createdBy, isActive: true }
        });

        if (!team) {
            throw createError(404, 'Team not found or access denied');
        }

        // Create event
        const event = await TeamEventModel.create({
            teamId,
            eventName,
            eventDate,
            clientId,
            createdBy
        });

        // Fetch event with details
        const eventWithDetails = await TeamEventModel.scope(['withTeam', 'withCreator', 'withClient']).findByPk(event.id);

        return {
            status: 1,
            data: eventWithDetails,
            message: 'Team event created successfully'
        };

    } catch (error) {
        console.error('Error in createEvent:', error);
        throw error;
    }
};

/**
 * Assign team members to event
 */
exports.assignMembers = async (data, loginUser) => {
    try {
        const { eventId, memberIds } = data;
        const userId = loginUser.id;

        // Verify event ownership
        const event = await TeamEventModel.findOne({
            where: { id: eventId, createdBy: userId, isActive: true },
            include: [{
                model: TeamModel,
                as: 'team',
                where: { ownerId: userId, isActive: true }
            }]
        });

        if (!event) {
            throw createError(404, 'Event not found or access denied');
        }

        // Verify all members belong to the team
        const teamMembers = await TeamMemberModel.findAll({
            where: { 
                teamId: event.teamId, 
                userId: { [Op.in]: memberIds },
                isActive: true 
            }
        });

        if (teamMembers.length !== memberIds.length) {
            throw createError(400, 'Some members do not belong to this team');
        }

        // Update assigned members
        await event.update({
            assignedMembers: memberIds
        });

        // Fetch updated event
        const updatedEvent = await TeamEventModel.scope(['withTeam', 'withCreator', 'withClient']).findByPk(eventId);

        return {
            status: 1,
            data: updatedEvent,
            message: 'Members assigned to event successfully'
        };

    } catch (error) {
        console.error('Error in assignMembers:', error);
        throw error;
    }
};

/**
 * Add task to event
 */
exports.addTask = async (data, loginUser) => {
    try {
        const { eventId, title, description, assignedTo, dueDate, priority } = data;
        const userId = loginUser.id;

        // Verify event ownership
        const event = await TeamEventModel.findOne({
            where: { id: eventId, createdBy: userId, isActive: true }
        });

        if (!event) {
            throw createError(404, 'Event not found or access denied');
        }

        // Verify assigned user belongs to team
        if (assignedTo) {
            const teamMember = await TeamMemberModel.findOne({
                where: { teamId: event.teamId, userId: assignedTo, isActive: true }
            });

            if (!teamMember) {
                throw createError(400, 'Assigned user does not belong to this team');
            }
        }

        // Create task
        const task = await EventTaskModel.create({
            eventId,
            title,
            description,
            assignedTo,
            dueDate,
            priority
        });

        // Fetch task with details
        const taskWithDetails = await EventTaskModel.scope(['withEvent', 'withAssignedUser']).findByPk(task.id);

        return {
            status: 1,
            data: taskWithDetails,
            message: 'Task added successfully'
        };

    } catch (error) {
        console.error('Error in addTask:', error);
        throw error;
    }
};

/**
 * Get team events
 */
exports.getTeamEvents = async (data, loginUser) => {
    try {
        const { teamId } = data;
        const userId = loginUser.id;

        // Verify team membership
        const teamMembership = await TeamMemberModel.findOne({
            where: { teamId, userId, isActive: true }
        });

        if (!teamMembership) {
            throw createError(404, 'Team not found or access denied');
        }

        // Get events
        const events = await TeamEventModel.scope(['withTeam', 'withCreator', 'withClient', 'withTasks']).findAll({
            where: { teamId, isActive: true },
            order: [['eventDate', 'ASC']]
        });

        return {
            status: 1,
            data: events,
            message: 'Team events retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getTeamEvents:', error);
        throw error;
    }
};

/**
 * Update event status
 */
exports.updateEventStatus = async (data, loginUser) => {
    try {
        const { eventId, status } = data;
        const userId = loginUser.id;

        // Verify event ownership
        const event = await TeamEventModel.findOne({
            where: { id: eventId, createdBy: userId, isActive: true }
        });

        if (!event) {
            throw createError(404, 'Event not found or access denied');
        }

        // Update status
        await event.update({ status });

        // Fetch updated event
        const updatedEvent = await TeamEventModel.scope(['withTeam', 'withCreator', 'withClient']).findByPk(eventId);

        return {
            status: 1,
            data: updatedEvent,
            message: 'Event status updated successfully'
        };

    } catch (error) {
        console.error('Error in updateEventStatus:', error);
        throw error;
    }
};

/**
 * Get event details
 */
exports.getEventDetails = async (data, loginUser) => {
    try {
        const { eventId } = data;
        const userId = loginUser.id;

        // Verify event access (team member)
        const event = await TeamEventModel.scope(['withTeam', 'withCreator', 'withClient', 'withTasks']).findOne({
            where: { id: eventId, isActive: true },
            include: [{
                model: TeamModel,
                as: 'team',
                include: [{
                    model: TeamMemberModel,
                    as: 'members',
                    where: { userId, isActive: true }
                }]
            }]
        });

        if (!event) {
            throw createError(404, 'Event not found or access denied');
        }

        return {
            status: 1,
            data: event,
            message: 'Event details retrieved successfully'
        };

    } catch (error) {
        console.error('Error in getEventDetails:', error);
        throw error;
    }
};

