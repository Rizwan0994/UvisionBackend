const {
    professionalServices: ProfessionalServicesModel,
    professionalProfile: ProfessionalProfileModel,
    user: UserModel,
    Op
} = require('../models');

/**
 * Create a new professional service
 */
const createService = async (data, loginUser) => {
    try {
        const userId = loginUser.id;
        
        // Find professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (!professionalProfile) {
            return { status: 0, message: 'Professional profile not found' };
        }

        const serviceData = {
            ...data,
            professionalId: professionalProfile.id
        };

        const service = await ProfessionalServicesModel.create(serviceData);

        return {
            service: service,
            message: 'Service created successfully'
        };
    } catch (error) {
        console.error('Error creating service:', error);
        throw error;
    }
};

/**
 * Get all services for logged in professional
 */
const getMyServices = async (loginUser) => {
    try {
        const userId = loginUser.id;
        
        // Find professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (!professionalProfile) {
            return { status: 0, message: 'Professional profile not found' };
        }

        const services = await ProfessionalServicesModel.findAll({
            where: { 
                professionalId: professionalProfile.id,
                isDeleted: false
            },
            order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
        });

        return {
            services: services,
            message: 'Services retrieved successfully'
        };
    } catch (error) {
        console.error('Error getting services:', error);
        throw error;
    }
};

/**
 * Update a professional service
 */
const updateService = async (serviceId, data, loginUser) => {
    try {
        const userId = loginUser.id;
        
        // Find professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (!professionalProfile) {
            return { status: 0, message: 'Professional profile not found' };
        }

        const service = await ProfessionalServicesModel.findOne({
            where: { 
                id: serviceId,
                professionalId: professionalProfile.id,
                isDeleted: false
            }
        });

        if (!service) {
            return { status: 0, message: 'Service not found' };
        }

        await service.update(data);

        return {
            service: service,
            message: 'Service updated successfully'
        };
    } catch (error) {
        console.error('Error updating service:', error);
        throw error;
    }
};

/**
 * Delete a professional service
 */
const deleteService = async (serviceId, loginUser) => {
    try {
        const userId = loginUser.id;
        
        // Find professional profile
        const professionalProfile = await ProfessionalProfileModel.findOne({
            where: { userId: userId }
        });

        if (!professionalProfile) {
            return { status: 0, message: 'Professional profile not found' };
        }

        const service = await ProfessionalServicesModel.findOne({
            where: { 
                id: serviceId,
                professionalId: professionalProfile.id,
                isDeleted: false
            }
        });

        if (!service) {
            return { status: 0, message: 'Service not found' };
        }

        await service.update({ isDeleted: true });

        return {
            message: 'Service deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
};

module.exports = {
    createService,
    getMyServices,
    updateService,
    deleteService
};
