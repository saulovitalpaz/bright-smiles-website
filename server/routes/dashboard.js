function createDashboardStatsHandler(prisma, buildUpcomingSchedule) {
    return async (req, res) => {
        try {
            const [users, appointments, leads, testimonials, pendingLeadCount] = await Promise.all([
                prisma.user.count(),
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

            const stock = ['admin', 'dentist'].includes(req.user?.role)
                ? await prisma.stockProduct.findMany({
                    where: { active: true },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    select: { id: true, name: true, quantity: true, stockUnit: true, price: true, reconstitutedAt: true }
                }) : undefined;
            const stockTotalValue = stock?.reduce((total, product) => total + Number(product.quantity) * Number(product.price), 0);
            const recentStock = stock?.slice(0, 3).map(product => ({
                    id: product.id,
                    name: product.name,
                    quantity: Number(product.quantity),
                    stockUnit: product.stockUnit,
                    reconstitutedAt: product.reconstitutedAt
                }));

            res.json({
                recentStock,
                stockTotalValue,
                users,
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
