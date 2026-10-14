import { useEffect, useRef, useState } from 'react';
import { digitalRequest, DigitalRequestError, ReauthenticationRequired, type DigitalIssue } from '@/lib/digital-prescriptions';

export function useDigitalPrescription(patientId: number | null, content: string, patientIdentity: string, expectedPatient?: { name: string; cpf: string }) {
  const key = JSON.stringify([patientId, content, patientIdentity]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const request = useRef<{ key: string; id: string; result?: DigitalIssue } | null>(null);
  if (request.current?.key !== key) request.current = null;
  const inFlight = useRef<Promise<DigitalIssue> | null>(null);
  const [result, setResult] = useState<DigitalIssue | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [reauthRequired, setReauthRequired] = useState(false);
  useEffect(() => { setResult(null); setError(''); setReauthRequired(false); }, [key]);

  const issue = (accountPassword?: string): Promise<DigitalIssue> => {
    if (inFlight.current) return inFlight.current;
    if (request.current?.key === key && request.current.result) return Promise.resolve(request.current.result);
    if (!patientId) return Promise.reject(new Error('Selecione um paciente cadastrado antes de emitir.'));
    if (!request.current || request.current.key !== key) request.current = { key, id: crypto.randomUUID() };
    const attempt = request.current;
    setPending(true); setError('');
    const promise = digitalRequest<DigitalIssue>('/prescriptions/digital-issue', {
      method: 'POST', body: JSON.stringify({ patientId, content, prescriptionType: 'SIMPLE', requestId: attempt.id, ...(expectedPatient ? { expectedPatient } : {}), ...(accountPassword ? { accountPassword } : {}) }),
    }).then(value => {
      if (currentKey.current !== key) throw new Error('Os dados mudaram durante a emissão. Confira a receita atual.');
      if (value.document.signatureStatus !== 'VALID') throw new Error('A assinatura não foi validada.');
      attempt.result = value; setResult(value); setReauthRequired(false); return value;
    }).catch((cause) => {
      if (cause instanceof ReauthenticationRequired) { setReauthRequired(true); setError(cause.message); throw cause; }
      if (cause instanceof DigitalRequestError) { setError(cause.message); throw cause; }
      const message = 'Emissão não confirmada. Tente novamente; a mesma solicitação será reutilizada para evitar duplicação.';
      setError(message); throw new Error(message);
    }).finally(() => { inFlight.current = null; setPending(false); });
    inFlight.current = promise;
    return promise;
  };
  return { issue, result: request.current?.key === key ? result : null, pending, error, reauthRequired };
}
