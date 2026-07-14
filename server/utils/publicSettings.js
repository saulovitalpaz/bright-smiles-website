const PUBLIC_SETTINGS_KEYS = new Set([
    'site_logo',
    'clinic_name',
    'clinic_slogan',
    'contact_whatsapp',
    'contact_instagram'
]);

const toPublicSettings = (settings) => settings
    .filter((setting) => PUBLIC_SETTINGS_KEYS.has(setting.key))
    .reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

module.exports = { PUBLIC_SETTINGS_KEYS, toPublicSettings };
