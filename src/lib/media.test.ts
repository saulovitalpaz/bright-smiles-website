import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { API_URL } from '@/lib/api';
import { assetDeliveryUrl, mediaUrl } from '@/lib/media';

describe('media delivery paths', () => {
  it('routes financial references through the protected API endpoint', () => {
    expect(assetDeliveryUrl('bucket://financial/9/receipt.pdf')).toBe(
      '/financial-assets?reference=bucket%3A%2F%2Ffinancial%2F9%2Freceipt.pdf',
    );
  });

  it('keeps legacy relative bucket delivery paths on the API origin', () => {
    expect(mediaUrl('/assets?reference=bucket%3A%2F%2Fpublic%2Fx.png')).toBe(
      `${API_URL}/assets?reference=bucket%3A%2F%2Fpublic%2Fx.png`,
    );
  });

  it('stores new financial receipts as stable protected references', () => {
    const root = resolve(__dirname, '..');
    const clinicFinance = readFileSync(resolve(root, 'pages/AdminFinance.tsx'), 'utf8');
    const personalFinance = readFileSync(resolve(root, 'pages/AdminPersonalFinance.tsx'), 'utf8');

    for (const source of [clinicFinance, personalFinance]) {
      expect(source).toMatch(/\$\{API_URL\}\/financial-assets/);
      expect(source).toMatch(/setReceiptUrl\(res\.data\.reference\)/);
      expect(source).toMatch(/href=\{mediaUrl\(t\.receiptUrl\)/);
    }
  });
});
