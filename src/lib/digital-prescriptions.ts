import { fetchClient } from './api';

export type DigitalDocument = { id: string; hash: string; signatureStatus: 'VALID'; signedAt: string; verificationUrl: string; token: string; fileUrl: string };
export type DigitalIssue = { prescription: { id: number; date: string; content: string; patientId: number }; document: DigitalDocument };
export type CertificateStatus = { available: boolean; certificate: null | { subjectName: string; cpfMasked: string; issuer: string; validFrom: string; validUntil: string; fingerprint: string; checkedAt: string; ready: boolean; status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED' | 'VERIFICATION_UNAVAILABLE'; suspendedAt?: string | null }; message?: string };

export class ReauthenticationRequired extends Error {}
export class DigitalRequestError extends Error {}
const codeMessages: Record<string, string> = {
  ACCESS_PASSWORD_INVALID: 'Senha de acesso inválida. Confira a senha de acesso ao sistema e tente novamente.',
  PATIENT_CHANGED: 'Os dados do paciente mudaram. Atualize o cadastro e revise a receita.',
  INVALID_CPF: 'Informe um CPF válido.',
  CPF_MISMATCH: 'O CPF informado não corresponde ao titular do certificado.',
  CERTIFICATE_EXPIRED: 'O certificado está vencido ou ainda não está vigente.',
  CERTIFICATE_SUSPENDED: 'O certificado está suspenso. Substitua o certificado nas configurações para voltar a assinar.',
  CERTIFICATE_REVOKED: 'O certificado foi revogado. Cadastre outro certificado válido.',
  CERTIFICATE_VERIFICATION_UNAVAILABLE: 'A verificação do certificado está temporariamente indisponível. Tente novamente em instantes.',
  VERIFICATION_UNAVAILABLE: 'A verificação do certificado está temporariamente indisponível. Tente novamente em instantes.',
  INVALID_CERTIFICATE: 'Certificado ou senha inválidos. Confira o arquivo A1 e sua senha.',
  CERTIFICATE_UNTRUSTED: 'Não foi possível verificar a confiança do certificado. Confira o certificado e tente novamente.',
  SIGNING_NOT_CONFIGURED: 'A cadeia ICP-Brasil ainda não foi configurada no servidor.',
  SIGNING_PENDING: 'Assinatura pendente ou interrompida. Confira o histórico antes de tentar emitir novamente.',
  SIGNING_REJECTED: 'Não foi possível validar o certificado ou documento. Confira o arquivo A1 e sua senha.',
};
const safeMessages = new Set([
  'Senha de acesso inválida.', 'Muitas tentativas. Aguarde e tente novamente.',
  'Arquivo inválido ou acima do limite.', 'Serviço de assinatura indisponível.',
  'Assinatura digital indisponível. Configure o cofre, armazenamento e validação ICP-Brasil.',
  'Certificado, CPF ou senha inválidos.', 'Preencha seu CRO no perfil.',
  'O certificado deve pertencer ao profissional cadastrado.', 'Cadastre seu certificado A1.',
  'Certificado inválido ou incompatível com o perfil atual.',
  'Paciente não encontrado ou sem consentimento registrado.',
  'Dados da receita inválidos. Apenas receitas simples são aceitas.',
  'Conteúdo da receita vazio.', 'A assinatura não passou na validação criptográfica.',
  'Envie um PDF válido.', 'Validação indisponível.',
]);
export function certificateReady(status: CertificateStatus | null): boolean {
  return status?.available === true && status.certificate?.ready === true && status.certificate.status === 'ACTIVE' && Date.parse(status.certificate.validFrom) <= Date.now() && Date.parse(status.certificate.validUntil) > Date.now();
}
export async function digitalRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetchClient(path, options);
  if (response.status === 428) throw new ReauthenticationRequired('Confirme sua senha de acesso para assinar.');
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const mapped = typeof body?.code === 'string' && Object.prototype.hasOwnProperty.call(codeMessages, body.code) ? codeMessages[body.code] : null;
    const safe = mapped || (safeMessages.has(body?.error) ? body.error : null);
    throw new DigitalRequestError(safe || 'Não foi possível concluir. Verifique os dados e tente novamente.');
  }
  return response.json();
}

export async function signedPdfBlob(id: string): Promise<Blob> {
  const response = await fetchClient(`/prescriptions/digital-documents/${encodeURIComponent(id)}/file`);
  if (!response.ok) throw new Error('Não foi possível abrir o PDF assinado.');
  return response.blob();
}

export async function downloadSignedPdf(id: string) {
  const url = URL.createObjectURL(await signedPdfBlob(id));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'receita-assinada.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
