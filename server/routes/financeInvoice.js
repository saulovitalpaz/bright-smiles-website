const { isSupportedUploadForScope } = require('../utils/uploadValidation');

function createFinanceInvoiceHandler({ prisma, uploadAsset, deleteAsset }) {
    return async (req, res) => {
        let uploadedReference;
        let linked = false;
        try {
            const rawId = req.body?.transactionId;
            const id = typeof rawId === 'string' && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN;
            if (!Number.isSafeInteger(id) || id > 2147483647) {
                return res.status(400).json({ error: 'Selecione uma receita válida.' });
            }
            if (!req.file || req.file.buffer.length > 25 * 1024 * 1024
                || !isSupportedUploadForScope('financial', req.file.buffer, req.file.mimetype)) {
                return res.status(400).json({ error: 'Anexe um PDF ou imagem JPEG, PNG ou WebP de até 25 MB.' });
            }
            const transaction = await prisma.financeTransaction.findUnique({ where: { id } });
            if (!transaction) return res.status(404).json({ error: 'Receita não encontrada.' });
            if (transaction.type !== 'income' || transaction.paymentStatus === 'voided') {
                return res.status(400).json({ error: 'A nota deve ser vinculada a uma receita não cancelada.' });
            }
            const asset = await uploadAsset({
                scope: 'financial', body: req.file.buffer,
                contentType: req.file.mimetype, ownerId: req.user.id
            });
            uploadedReference = asset.reference;
            const updated = await prisma.financeTransaction.updateMany({
                where: { id, type: 'income', paymentStatus: { not: 'voided' }, nfeUrl: transaction.nfeUrl },
                data: { nfeUrl: uploadedReference }
            });
            if (updated.count !== 1) {
                return res.status(409).json({ error: 'A receita mudou durante o envio. Atualize a página e tente novamente.' });
            }
            linked = true;
            return res.json({ transactionId: id, nfeUrl: uploadedReference });
        } catch {
            return res.status(500).json({ error: 'Não foi possível anexar a nota fiscal. Tente novamente.' });
        } finally {
            if (uploadedReference && !linked) {
                await deleteAsset(uploadedReference).catch(() => {});
            }
        }
    };
}

module.exports = { createFinanceInvoiceHandler };
