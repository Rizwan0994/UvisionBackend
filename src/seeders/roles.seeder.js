'use strict';
const db = require('../models');

const defaultRoles = [
    { id: 1, name: 'admin' },
    { id: 2, name: 'client' },
    { id: 3, name: 'professional' }
];

async function seedRoles() {
    try {
        for (const role of defaultRoles) {
            // Check if role already exists
            const existingRole = await db.roles.findOne({ where: { id: role.id } });
            if (!existingRole) {
                await db.roles.create(role);
                console.log(`✅ Role ${role.name} created successfully 🎉`);
            }
        }
        console.log('🌱 Roles seeding completed 🚀');
    } catch (error) {
        console.error('❌ Error seeding roles:', error);
    }
}

module.exports = seedRoles;
