# Correção de impressão de documentos e modelo manual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preservar logo/cabeçalho na impressão de documentos e remover a assinatura do paciente do modelo manual.

**Architecture:** Os componentes de documentos imprimíveis continuarão responsáveis pela apresentação impressa. Um helper pequeno no módulo compartilhado de layout aguardará imagens ainda não carregadas no alvo de impressão antes de `window.print()` em Termos e Documentos, Prescrição e Odontograma, mantendo o shell administrativo separado dos documentos.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, CSS de impressão compartilhado.

## Global Constraints

- Seguir `SECURITY.md`; não alterar autenticação, armazenamento, permissões ou dados clínicos.
- Preservar arquivos não rastreados pertencentes ao usuário e documentação existente.
- O modo manual não pode renderizar o campo ou rótulo `Assinatura do Paciente`.
- O documento normal deve continuar renderizando paciente, assinatura profissional opcional, logo e cabeçalho.
- Toda alteração de comportamento deve ter teste que falhe antes da implementação.

---

### Task 1: Cobrir os comportamentos de documento normal e manual

**Files:**
- Modify: `src/components/admin/ClinicDocumentPrint.test.tsx`

**Interfaces:**
- Consumes: `ClinicDocumentPrint` com as props atuais, incluindo `manual`.
- Produces: regressão para a ausência estrutural da assinatura do paciente no modo manual e preservação no modo normal.

- [ ] **Step 1: Escrever os testes falhando**

Adicionar ao teste manual asserções para o cabeçalho e para a ausência do campo completo:

```tsx
expect(screen.getByRole("heading", { name: "Núcleo Odontológico" })).toBeInTheDocument();
expect(screen.queryByText("Assinatura do Paciente")).not.toBeInTheDocument();
```

Adicionar ao teste de documento normal:

```tsx
expect(screen.getByText("Assinatura do Paciente")).toBeInTheDocument();
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm test -- src/components/admin/ClinicDocumentPrint.test.tsx`

Expected: FAIL na asserção de ausência porque o componente ainda renderiza `Assinatura do Paciente` no modo manual.

- [ ] **Step 3: Implementar a apresentação condicional mínima**

Em `ClinicDocumentPrint.tsx`, renderizar o bloco do paciente apenas quando `manual` for falso, mantendo `ProfessionalSignature` e o restante do documento. O bloco deve manter as classes de impressão atuais nos documentos normais e usar o fluxo centralizado do modo manual:

```tsx
<div className={`print-signature mt-20 ${manual ? "text-center" : "grid grid-cols-2 gap-12"} border-t border-slate-200 pt-8`}>
  {!manual && (
    <div className="text-center">
      <div className="mx-auto mb-2 w-64 border-b border-slate-900" />
      <p className="text-[10px] font-bold uppercase">Assinatura do Paciente</p>
      <p className="mt-1 text-[9px] text-slate-500">{patient.name} - {patient.cpf}</p>
    </div>
  )}
  <ProfessionalSignature professional={professional} includeElectronic={!manual && includeElectronic} />
</div>
```

- [ ] **Step 4: Rodar os testes para confirmar a passagem**

Run: `npm test -- src/components/admin/ClinicDocumentPrint.test.tsx`

Expected: PASS em todos os testes do componente.

### Task 2: Aguardar o logo antes de abrir a impressão

**Files:**
- Modify: `src/lib/print-layout.ts`
- Create: `src/lib/print-layout.test.ts`
- Modify: `src/pages/AdminDocuments.tsx`
- Modify: `src/pages/AdminPrescription.tsx`
- Modify: `src/pages/AdminAttendanceDetail.tsx`
- Modify: `src/pages/AdminAttendanceFlow.test.tsx`
- Modify: `src/components/admin/navigation-contract.test.tsx`
- Modify: `src/index.css`
- Modify: `scripts/verify-document-print.ps1`

**Interfaces:**
- Consumes: um `ParentNode` contendo o alvo explícito de impressão.
- Produces: `waitForPrintImages(root: ParentNode): Promise<void>` exportada por `src/lib/print-layout.ts`, que resolve imediatamente para imagens completas e aguarda `load` ou `error` para imagens pendentes.

- [ ] **Step 1: Escrever o teste unitário falhando**

Criar `src/lib/print-layout.test.ts` usando o módulo existente e a exportação esperada:

```ts
import { describe, expect, it } from "vitest";
import * as printLayout from "./print-layout";

const waitForPrintImages = (printLayout as typeof printLayout & {
  waitForPrintImages?: (root: ParentNode) => Promise<void>;
}).waitForPrintImages;

describe("waitForPrintImages", () => {
  it("waits for incomplete print images before resolving", async () => {
    const root = document.createElement("div");
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { configurable: true, value: false });
    root.append(image);

    let resolved = false;
    expect(waitForPrintImages).toBeTypeOf("function");
    const pending = waitForPrintImages!(root).then(() => { resolved = true; });
    await Promise.resolve();

    expect(resolved).toBe(false);
    image.dispatchEvent(new Event("load"));
    await pending;
    expect(resolved).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm test -- src/lib/print-layout.test.ts`

Expected: FAIL porque `waitForPrintImages` ainda não é exportada pelo módulo de layout.

- [ ] **Step 3: Implementar o helper mínimo**

Adicionar a `src/lib/print-layout.ts`:

```ts
export function waitForPrintImages(root: ParentNode): Promise<void> {
  const pendingImages = Array.from(root.querySelectorAll("img")).filter((image) => !image.complete);
  return Promise.all(pendingImages.map((image) => new Promise<void>((resolve) => {
    const settle = () => {
      image.removeEventListener("load", settle);
      image.removeEventListener("error", settle);
      resolve();
    };
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
  }))).then(() => undefined);
}
```

Atualizar o efeito de impressão em `AdminDocuments.tsx` para aguardar o próximo frame, localizar `[data-print-target="document"]`, aguardar suas imagens e só então chamar `window.print()`. O cleanup deve cancelar o frame e impedir a impressão se o efeito for desmontado:

```tsx
React.useEffect(() => {
  if (!isPrintReady) return;

  let cancelled = false;
  const clearPrintReady = () => setIsPrintReady(false);
  window.addEventListener("afterprint", clearPrintReady);
  const frame = window.requestAnimationFrame(() => {
    void (async () => {
      const printTarget = document.querySelector('[data-print-target="document"]');
      if (printTarget) await waitForPrintImages(printTarget);
      if (!cancelled) window.print();
    })();
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
    window.removeEventListener("afterprint", clearPrintReady);
  };
}, [isPrintReady]);
```

- [ ] **Step 4: Rodar os testes focados**

Run: `npm test -- src/lib/print-layout.test.ts src/components/admin/ClinicDocumentPrint.test.tsx src/components/admin/navigation-contract.test.tsx src/pages/AdminAttendanceFlow.test.tsx`

Expected: PASS sem erros ou avisos.

### Task 3: Verificação completa e entrega

**Files:**
- Modify: files from Tasks 1-2 only, plus `src/index.css`, `scripts/verify-document-print.ps1` and generated documentation commits.

**Interfaces:**
- Consumes: implementação e testes das Tasks 1-2.
- Produces: branch `main` verificada, commit de código e push para `origin/main`.

- [ ] **Step 1: Rodar os testes completos do frontend**

Run: `npm test`

Expected: exit code 0 e todos os testes passando.

- [ ] **Step 2: Rodar lint, build e contratos de impressão**

Run: `npm run lint`

Run: `npm run build`

Run: `powershell -ExecutionPolicy Bypass -File scripts/verify-document-print.ps1`

Expected: exit code 0 em cada comando.

- [ ] **Step 3: Rodar verificações de segurança e diff**

Run: `git diff --check`

Run: `rg -n "(password|secret|token|api[_-]?key|private[_-]?key)\\s*[:=]" --glob '!package-lock.json' --glob '!bun.lockb' .`

Expected: `git diff --check` sem saída; a busca não deve encontrar novos segredos nos arquivos alterados.

- [ ] **Step 4: Revisar o diff e criar o commit de implementação**

Run: `git status --short; git diff --stat; git diff -- src/components/admin/ClinicDocumentPrint.tsx src/components/admin/ClinicDocumentPrint.test.tsx src/components/admin/navigation-contract.test.tsx src/index.css src/lib/print-layout.ts src/lib/print-layout.test.ts src/pages/AdminDocuments.tsx src/pages/AdminPrescription.tsx src/pages/AdminAttendanceDetail.tsx src/pages/AdminAttendanceFlow.test.tsx scripts/verify-document-print.ps1`

Confirmar que apenas os arquivos esperados foram modificados e criar:

```bash
git add src/components/admin/ClinicDocumentPrint.tsx src/components/admin/ClinicDocumentPrint.test.tsx src/lib/print-layout.ts src/lib/print-layout.test.ts src/pages/AdminDocuments.tsx
git commit -m "fix: preserve document print header and manual form"
```

- [ ] **Step 5: Confirmar o commit e enviar para origin/main**

Run: `git status --short --branch; git log -2 --oneline`

Confirmar branch `main`, working tree limpo e commits de documentação/implementação presentes. Então executar:

```bash
git push origin main
```

Expected: push concluído para `origin/main` sem rejeição.
