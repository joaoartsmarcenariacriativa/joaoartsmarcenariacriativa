export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatParcela(value: number, maxParcelas = 12): string {
  const parcela = value / maxParcelas;
  if (parcela < 1) {
    const parcelasViaveis = Math.floor(value / 1);
    if (parcelasViaveis < 2) return 'À vista';
    return `${parcelasViaveis}x de ${formatBRL(value / parcelasViaveis)} sem juros`;
  }
  return `${maxParcelas}x de ${formatBRL(parcela)} sem juros`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JA${year}${month}${day}${random}`;
}
