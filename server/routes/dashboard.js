function createDashboardStatsHandler(prisma, buildUpcomingSchedule) {
    return async (req, res) => {
        try {
            const [users, posts, appointments, leads, testimonials, pendingLeadCount] = await Promise.all([
                prisma.user.count(),
                prisma.post.count(),
                prisma.appointment.count(),
                prisma.lead.count(),
                prisma.testimonial.count(),
                prisma.lead.count({
                    where: { status: { in: ['new', 'contacted', 'scheduled'] } }
                })
            ]);

            const recentAppointments = await prisma.appointment.findMany({
                take: 5,
                orderBy: { date: 'desc' }
            });

            const recentLeads = await prisma.lead.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });

            const [scheduledAppointments, scheduledLeads] = await Promise.all([
                prisma.appointment.findMany({
                    where: { scheduledAt: { not: null } },
                    orderBy: { scheduledAt: 'asc' }
                }),
                prisma.lead.findMany({
                    where: {
                        scheduledAt: { not: null },
                        status: { not: 'completed' }
                    },
                    orderBy: { scheduledAt: 'asc' }
                })
            ]);

            const upcomingSchedule = buildUpcomingSchedule({
                appointments: scheduledAppointments,
                leads: scheduledLeads
            });

            const recentTestimonials = await prisma.testimonial.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                users,
                posts,
                appointments,
                leads,
                pendingLeadCount,
                testimonials,
                upcomingSchedule,
                recentAppointments,
                recentLeads,
                recentTestimonials
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = { createDashboardStatsHandler };
