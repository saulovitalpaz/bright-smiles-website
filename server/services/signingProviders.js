function normalizeProvider(value = 'A1') {
    if (value !== 'A1' && value !== 'BIRD_ID') {
        throw Object.assign(new Error('Método de assinatura inválido.'), { status: 400, code: 'INVALID_SIGNING_PROVIDER' });
    }
    return value;
}

function providerAvailability(config = {}, a1Available = false) {
    // Activation requires a verified CESS adapter, not merely environment variables.
    return [
        { provider: 'A1', available: a1Available },
        { provider: 'BIRD_ID', available: false, reason: config.BIRD_ID_ENABLED === 'true' ? 'BIRD_ID_CONTRACT_PENDING' : 'BIRD_ID_NOT_CONFIGURED' },
    ];
}

module.exports = { normalizeProvider, providerAvailability };
