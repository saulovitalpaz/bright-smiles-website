export const financePeriodQuery = (month: number, year: number) =>
  new URLSearchParams({ month: String(month), year: String(year) }).toString();

export const financePeriodTitle = (month: number, year: number) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    .format(new Date(Date.UTC(year, month - 1, 15)));
