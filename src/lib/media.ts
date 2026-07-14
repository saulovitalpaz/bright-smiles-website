import { API_URL, fetchClient } from "@/lib/api";

const PUBLIC_REFERENCE_PREFIX = 'bucket://public/';
const CLINICAL_REFERENCE_PREFIX = 'bucket://clinical/';

export const assetDeliveryUrl = (value?: string | null) => {
    if (!value) return null;
    if (value.startsWith(CLINICAL_REFERENCE_PREFIX)) {
        return `/clinical-assets?reference=${encodeURIComponent(value)}`;
    }
    if (value.startsWith(PUBLIC_REFERENCE_PREFIX)) {
        return `/assets?reference=${encodeURIComponent(value)}`;
    }
    return value;
};

export const mediaUrl = (value?: string | null) => {
    if (!value) return null;
    if (/^(https?:|blob:|data:)/i.test(value)) return value;
    if (value.startsWith('/images/')) return value;
    return `${API_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export const loadProtectedAsset = async (value: string) => {
    const response = await fetchClient(value);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Não foi possível carregar o arquivo clínico.');
    }
    return URL.createObjectURL(await response.blob());
};

export const isClinicalAssetReference = (value?: string | null) =>
    typeof value === 'string' && value.startsWith(CLINICAL_REFERENCE_PREFIX);
