const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

function isJpeg(buffer) {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer) {
    return buffer.length >= 8
        && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isWebp(buffer) {
    return buffer.length >= 12
        && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

function isPdf(buffer) {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

function mediaBrand(buffer) {
    if (buffer.length < 12 || buffer.subarray(4, 8).toString('ascii') !== 'ftyp') return null;
    return buffer.subarray(8, 12).toString('ascii');
}

function isMp4(buffer) {
    const brand = mediaBrand(buffer);
    return Boolean(brand && brand !== 'qt  ');
}

function isQuickTime(buffer) {
    return mediaBrand(buffer) === 'qt  ';
}

function isWebm(buffer) {
    return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
}

function isSupportedUpload(buffer, mimeType) {
    if (!Buffer.isBuffer(buffer)) return false;
    if (mimeType === 'image/jpeg') return isJpeg(buffer);
    if (mimeType === 'image/png') return isPng(buffer);
    if (mimeType === 'image/webp') return isWebp(buffer);
    if (mimeType === 'application/pdf') return isPdf(buffer);
    if (mimeType === 'video/mp4') return isMp4(buffer);
    if (mimeType === 'video/quicktime') return isQuickTime(buffer);
    if (mimeType === 'video/webm') return isWebm(buffer);
    return false;
}

function isSupportedUploadForScope(scope, buffer, mimeType) {
    if (!isSupportedUpload(buffer, mimeType)) return false;
    if (scope === 'public') return IMAGE_TYPES.has(mimeType) || VIDEO_TYPES.has(mimeType);
    if (scope === 'clinical') return IMAGE_TYPES.has(mimeType);
    if (scope === 'financial') return IMAGE_TYPES.has(mimeType) || mimeType === 'application/pdf';
    return false;
}

module.exports = {
    isSupportedUpload,
    isSupportedUploadForScope
};
