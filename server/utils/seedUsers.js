const { hashPassword } = require('./passwords');

const profiles = [
    { key: 'SUPPORT', username: 'Suporte Admin', name: 'Suporte Técnico', role: 'admin', cro: 'Saulo' },
    { key: 'ANA', username: 'Dra. Ana Karolina', name: 'Ana Karolina', role: 'admin', cro: 'CRO/MG 60.514' },
    { key: 'CLARA', username: 'Dra. Clara Lima', name: 'Clara Lima', role: 'admin', cro: 'CRO/MG 60.369' },
    { key: 'MANAGER', username: 'Neli Vital', name: 'Neli Vital', role: 'manager', cro: 'Gerência' },
];

async function buildSeedUsers(env) {
    const passwords = profiles.map(({ key }) => {
        const variable = `SEED_${key}_PASSWORD`;
        const value = env[variable];
        if (typeof value !== 'string' || value.trim().length < 12 || value.length > 256) {
            throw new Error(`${variable} must contain between 12 and 256 characters.`);
        }
        return value;
    });
    return Promise.all(profiles.map(async ({ key, ...profile }, index) => ({
        ...profile,
        password: await hashPassword(passwords[index]),
    })));
}

module.exports = { buildSeedUsers };
