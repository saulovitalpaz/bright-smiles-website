import { useEffect, useState } from 'react';
import { fetchClient } from '@/lib/api';
import type { ClinicPrintDetails } from '@/components/admin/ClinicPrintHeader';

export function useClinicPrintDetails() {
  const [clinic, setClinic] = useState<ClinicPrintDetails>({});
  useEffect(() => {
    let active = true;
    fetchClient('/digital-signatures/clinic').then(response => response.ok ? response.json() : {}).then(value => {
      if (active) setClinic(value);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  return clinic;
}
