const SIGNATURE_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

function isSupportedSignatureImage(buffer, mimeType) {
    if (!Buffer.isBuffer(buffer) || !SIGNATURE_IMAGE_TYPES.has(mimeType)) return false;

    if (mimeType === 'image/jpeg') {
        return buffer.length >= 3
            && buffer[0] === 0xff
            && buffer[1] === 0xd8
            && buffer[2] === 0xff;
    }
    if (mimeType === 'image/png') {
        return buffer.length >= 8
            && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    return buffer.length >= 12
        && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

function signatureExtension(mimeType) {
    return mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
}

module.exports = {
    SIGNATURE_IMAGE_TYPES,
    isSupportedSignatureImage,
    signatureExtension
};
