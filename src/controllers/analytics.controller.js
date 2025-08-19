const db = require('../models');
const { Op } = require('sequelize');
const { 
    professionalProfile: ProfessionalProfileModel, 
    professionalBookings: ProfessionalBookingsModel, 
    profileView: ProfileViewModel, 
    bookingPayments: BookingPaymentsModel, 
    professionalReviews: ProfessionalReviewsModel 
} = db;

// Track profile view (call this when someone views a professional profile)
exports.trackProfileView = async (req, res) => {
    try {
        const { professionalId } = req.params;
        const viewerId = req.loginUser?.id || null;
        const viewerIp = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const referrer = req.get('Referer');
        const sessionId = req.sessionID || req.headers['x-session-id'];

        // Verify professional exists
        const professional = await ProfessionalProfileModel.findByPk(professionalId);
        if (!professional) {
            return res.status(404).json({ message: 'Professional profile not found' });
        }

        // Create profile view record
        await ProfileViewModel.create({
            professionalId,
            viewerId,
            viewerIp,
            userAgent,
            referrer,
            sessionId
        });

        res.status(200).json({ message: 'Profile view tracked successfully' });
    } catch (error) {
        console.error('Error tracking profile view:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get comprehensive analytics for a professional
exports.getAnalytics = async (req, res) => {
    try {
        const loginUser = req.loginUser;
        
        // Get professional profile
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return res.status(404).json({ message: "Professional profile not found" });
        }

        const professionalId = profile.id;
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentYear = new Date(now.getFullYear(), 0, 1);

        // Calculate date ranges
        const last12Months = [];
        for (let i = 11; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last12Months.push({
                start: month,
                end: new Date(month.getFullYear(), month.getMonth() + 1, 0),
                name: month.toLocaleDateString('en-US', { month: 'short' })
            });
        }

        // Get profile views
        const totalProfileViews = await ProfileViewModel.count({
            where: { professionalId }
        });

        const monthlyProfileViews = await ProfileViewModel.count({
            where: { 
                professionalId,
                viewDate: { [Op.gte]: currentMonth }
            }
        });

        // Get booking statistics
        const totalBookings = await ProfessionalBookingsModel.count({
            where: { professionalId }
        });

        const monthlyBookings = await ProfessionalBookingsModel.count({
            where: { 
                professionalId,
                createdAt: { [Op.gte]: currentMonth }
            }
        });

        const completedBookings = await ProfessionalBookingsModel.count({
            where: { 
                professionalId,
                status: 'completed'
            }
        });

        // Get booking requests (pending + confirmed + in_progress + completed)
        const bookingRequests = await ProfessionalBookingsModel.count({
            where: { 
                professionalId,
                status: { [Op.in]: ['pending', 'confirmed', 'in_progress', 'completed'] }
            }
        });

        const monthlyBookingRequests = await ProfessionalBookingsModel.count({
            where: { 
                professionalId,
                createdAt: { [Op.gte]: currentMonth },
                status: { [Op.in]: ['pending', 'confirmed', 'in_progress', 'completed'] }
            }
        });

        // Calculate response rate (you may need to adjust this based on your chat/messaging system)
        // For now, let's use a placeholder calculation based on completed vs total bookings
        const responseRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

        // Get revenue data
        const monthlyRevenue = await BookingPaymentsModel.sum('amount', {
            where: {
                professionalId,
                status: 'succeeded',
                createdAt: { [Op.gte]: currentMonth }
            }
        }) || 0;

        const totalRevenue = await BookingPaymentsModel.sum('amount', {
            where: {
                professionalId,
                status: 'succeeded'
            }
        }) || 0;

        // Get yearly revenue
        const yearlyRevenue = await BookingPaymentsModel.sum('amount', {
            where: {
                professionalId,
                status: 'succeeded',
                createdAt: { [Op.gte]: currentYear }
            }
        }) || 0;

        // Get monthly data for charts
        const monthlyData = await Promise.all(
            last12Months.map(async (month) => {
                const [views, bookings, revenue] = await Promise.all([
                    ProfileViewModel.count({
                        where: {
                            professionalId,
                            viewDate: {
                                [Op.gte]: month.start,
                                [Op.lte]: month.end
                            }
                        }
                    }),
                    ProfessionalBookingsModel.count({
                        where: {
                            professionalId,
                            createdAt: {
                                [Op.gte]: month.start,
                                [Op.lte]: month.end
                            }
                        }
                    }),
                    BookingPaymentsModel.sum('amount', {
                        where: {
                            professionalId,
                            status: 'succeeded',
                            createdAt: {
                                [Op.gte]: month.start,
                                [Op.lte]: month.end
                            }
                        }
                    }) || 0
                ]);

                return {
                    month: month.name,
                    views,
                    bookings,
                    revenue: Math.round(revenue)
                };
            })
        );

        // Get average response time (placeholder - you may need to implement based on your messaging system)
        const avgResponseTime = profile.responseTime || 'New Professional';

        // Calculate growth rates
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [previousMonthViews, previousMonthRevenue] = await Promise.all([
            ProfileViewModel.count({
                where: {
                    professionalId,
                    viewDate: {
                        [Op.gte]: previousMonth,
                        [Op.lte]: previousMonthEnd
                    }
                }
            }),
            BookingPaymentsModel.sum('amount', {
                where: {
                    professionalId,
                    status: 'succeeded',
                    createdAt: {
                        [Op.gte]: previousMonth,
                        [Op.lte]: previousMonthEnd
                    }
                }
            }) || 0
        ]);

        const viewsGrowthRate = previousMonthViews > 0 
            ? Math.round(((monthlyProfileViews - previousMonthViews) / previousMonthViews) * 100)
            : monthlyProfileViews > 0 ? 100 : 0;

        const revenueGrowthRate = previousMonthRevenue > 0 
            ? Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
            : monthlyRevenue > 0 ? 100 : 0;

        // Get rating information
        const { rating, totalReviews } = profile;

        const analyticsData = {
            overview: {
                profileViews: totalProfileViews,
                monthlyProfileViews,
                bookingRequests: bookingRequests,
                monthlyBookingRequests,
                responseRate,
                monthlyRevenue: Math.round(monthlyRevenue),
                totalRevenue: Math.round(totalRevenue),
                yearlyRevenue: Math.round(yearlyRevenue),
                totalBookings,
                completedBookings,
                rating: rating || 0,
                totalReviews: totalReviews || 0
            },
            monthlyData,
            performance: {
                viewsGrowthRate,
                revenueGrowthRate,
                avgResponseTime,
                completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
            }
        };

        res.status(200).json({
            success: true,
            data: analyticsData,
            message: 'Analytics data retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

// Get realtime stats (for frequent updates)
exports.getRealtimeStats = async (req, res) => {
    try {
        const loginUser = req.loginUser;
        
        const profile = await ProfessionalProfileModel.findOne({
            where: { userId: loginUser.id }
        });

        if (!profile) {
            return res.status(404).json({ message: "Professional profile not found" });
        }

        const professionalId = profile.id;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get today's stats
        const [todayViews, todayBookings, pendingBookings] = await Promise.all([
            ProfileViewModel.count({
                where: {
                    professionalId,
                    viewDate: { [Op.gte]: today }
                }
            }),
            ProfessionalBookingsModel.count({
                where: {
                    professionalId,
                    createdAt: { [Op.gte]: today }
                }
            }),
            ProfessionalBookingsModel.count({
                where: {
                    professionalId,
                    status: 'pending'
                }
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                todayViews,
                todayBookings,
                pendingBookings,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error getting realtime stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};
