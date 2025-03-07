import { useSettingsStore, currencySymbols } from "@/lib/settings";

export function useCurrency() {
  const { currency } = useSettingsStore();
  
  const format = (amount: number) => {
    const symbol = currencySymbols[currency] || currency;
    if (currency === 'RSD') {
      return `${amount.toFixed(2)} ${symbol}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
  };

  return { format };
}
