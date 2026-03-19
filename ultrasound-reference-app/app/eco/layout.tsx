import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VPVet - Referência Cardiológica',
  description: 'Sistema avançado de calculadoras e referências cardiológicas veterinárias',
};

export default function EcoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
