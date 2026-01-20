import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";

interface CurrencyRate {
  id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  rate_to_usd: number;
  updated_at: string;
}

export default function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from("currency_rates")
        .select("*")
        .order("currency_code");

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("Failed to load currency rates");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (currency: CurrencyRate) => {
    setEditingId(currency.id);
    setEditValues({ ...editValues, [currency.id]: currency.rate_to_usd });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSave = async (currencyId: string) => {
    const newRate = editValues[currencyId];
    
    if (!newRate || newRate <= 0) {
      toast.error("Please enter a valid exchange rate");
      return;
    }

    try {
      const { error } = await supabase
        .from("currency_rates")
        .update({ rate_to_usd: newRate })
        .eq("id", currencyId);

      if (error) throw error;

      toast.success("Exchange rate updated successfully");
      setEditingId(null);
      setEditValues({});
      fetchCurrencies();
    } catch (error) {
      console.error("Error updating currency:", error);
      toast.error("Failed to update exchange rate");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground">Loading currency rates...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Currency Exchange Rates</h1>
        <p className="text-muted-foreground">
          Manage exchange rates for all supported currencies. All rates are relative to 1 USD.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Currency Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currencies.map((currency) => (
              <div
                key={currency.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
                    {currency.currency_symbol}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {currency.currency_name} ({currency.currency_code})
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(currency.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {editingId === currency.id ? (
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`rate-${currency.id}`} className="text-xs">
                          Rate to USD
                        </Label>
                        <Input
                          id={`rate-${currency.id}`}
                          type="number"
                          step="0.0001"
                          value={editValues[currency.id] || ""}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [currency.id]: parseFloat(e.target.value),
                            })
                          }
                          className="w-32"
                        />
                      </div>
                      <div className="flex gap-2 mt-6">
                        <Button
                          size="sm"
                          onClick={() => handleSave(currency.id)}
                          className="gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {currency.rate_to_usd.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">per 1 USD</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(currency)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Exchange rates are used throughout the application for currency
            conversion. Changes will be reflected immediately for all users. Make sure to use
            current market rates for accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
