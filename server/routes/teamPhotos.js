const multer = require('multer');
const { isSupportedUpload } = require('../utils/uploadValidation');

// Login names are unique and cannot be changed by /users/me. Never authorize by display name or client-provided IDs.
const MEMBERS = new Map([['Dra. Ana Karolina', 'ana-karolina'], ['Dra. Clara Lima', 'clara-lima']]);
const settingKey = member => `team_photo_${member}`;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function validPortrait(file) {
    if (!file || !IMAGE_TYPES.has(file.mimetype) || !isSupportedUpload(file.buffer, file.mimetype)) return false;
    const bytes = file.buffer;
    if (file.mimetype === 'image/png') {
        return bytes.length >= 45 && bytes.toString('ascii', 12, 16) === 'IHDR'
            && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0
            && bytes.readUInt32BE(16) <= 8000 && bytes.readUInt32BE(20) <= 8000
            && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
    }
    if (file.mimetype === 'image/jpeg') return bytes.length > 4 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    return bytes.length > 20 && bytes.readUInt32LE(4) + 8 === bytes.length;
}

function registerTeamPhotoRoutes(app, { prisma, authenticateToken, authorizeRole, uploadAsset, deleteAsset }) {
    const access = [authenticateToken, authorizeRole(['admin', 'dentist'])];
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 }, fileFilter: (_req, file, callback) => callback(null, IMAGE_TYPES.has(file.mimetype)) }).single('file');
    const ownMember = async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { username: true, role: true } });
            const member = MEMBERS.get(user?.username);
            if (!member || !['admin', 'dentist'].includes(user.role)) return res.status(403).json({ error: 'Esta conta não possui uma foto vinculada à equipe da homepage.' });
            req.teamMember = member;
            next();
        } catch { res.status(500).json({ error: 'Não foi possível verificar a profissional.' }); }
    };

    // Intentionally public: homepage portraits only; no user records or private settings are returned.
    app.get('/team/photos', async (_req, res) => {
        try {
            const rows = await prisma.setting.findMany({ where: { key: { in: [...MEMBERS.values()].map(settingKey) } }, select: { key: true, value: true } });
            const photos = {};
            for (const member of MEMBERS.values()) {
                const photo = rows.find(row => row.key === settingKey(member))?.value;
                if (photo?.startsWith('bucket://public/')) photos[member] = photo;
            }
            res.set('Cache-Control', 'no-store');
            res.json(photos);
        } catch { res.status(500).json({ error: 'Não foi possível carregar as fotos.' }); }
    });
    app.get('/team/photo/me', ...access, ownMember, async (req, res) => {
        try {
            const row = await prisma.setting.findUnique({ where: { key: settingKey(req.teamMember) } });
            res.set('Cache-Control', 'no-store');
            res.json({ member: req.teamMember, photo: row?.value || null });
        } catch { res.status(500).json({ error: 'Não foi possível carregar sua foto.' }); }
    });
    app.put('/team/photo/me', ...access, ownMember, (req, res, next) => {
        if (Object.keys(req.query).length) return res.status(400).json({ error: 'O envio aceita apenas a sua imagem.' });
        upload(req, res, error => error ? res.status(400).json({ error: 'Envie uma imagem PNG, JPG ou WebP de até 5 MB, sem outros campos.' }) : next());
    }, async (req, res) => {
        if (!validPortrait(req.file)) return res.status(400).json({ error: 'Imagem inválida. Envie um arquivo PNG, JPG ou WebP válido.' });
        let reference;
        try {
            const asset = await uploadAsset({ scope: 'public', body: req.file.buffer, contentType: req.file.mimetype, ownerId: req.user.id });
            reference = asset.reference;
            const key = settingKey(req.teamMember);
            await prisma.setting.upsert({ where: { key }, create: { key, value: reference }, update: { value: reference } });
            res.json({ member: req.teamMember, photo: reference });
        } catch {
            if (reference) { try { await deleteAsset(reference); } catch { /* Preserve the previous published photo if cleanup is unavailable. */ } }
            res.status(500).json({ error: 'Não foi possível salvar a foto. Tente novamente.' });
        }
    });
}

module.exports = { registerTeamPhotoRoutes };
