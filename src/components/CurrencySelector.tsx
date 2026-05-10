import { useCurrency } from '@/contexts/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();

  const currencies = [
    { code: 'GHS' as const, symbol: '₵', name: 'Ghana Cedis' },
    { code: 'USD' as const, symbol: '$', name: 'US Dollar' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2">
          <span className="font-medium">{currentCurrency?.symbol}</span>
          <span className="hidden sm:inline">{currency}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-background">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code)}
            className={currency === curr.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{curr.symbol}</span>
            <span>{curr.code}</span>
            <span className="ml-2 text-muted-foreground text-sm">({curr.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
