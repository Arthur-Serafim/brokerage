"use client";

import { useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useSymbols } from "@/hooks/use-symbols";
import { useBrokerage } from "@/hooks/use-brokerage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const buyAssetSchema = z.object({
  symbol: z.string().min(1, "Please select a symbol"),
  shares: z
    .string()
    .min(1, "Please enter number of shares")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Shares must be greater than 0",
    })
    .refine((val) => Number.isInteger(Number(val)), {
      message: "Shares must be a whole number",
    }),
});

type BuyAssetFormData = z.infer<typeof buyAssetSchema>;

interface BuyAssetDialogProps {
  onBuy: (symbol: string, name: string, price: number, shares: number) => void;
}

export function BuyAssetDialog({ onBuy }: BuyAssetDialogProps) {
  const [buyDialog, setBuyDialog] = useQueryState("buy", {
    defaultValue: "",
    parse: (value) => value || "",
    serialize: (value) => value || "",
  });

  const { data: symbolsData, isLoading, isError } = useSymbols();
  const { user } = useBrokerage();
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BuyAssetFormData>({
    resolver: zodResolver(buyAssetSchema),
    defaultValues: {
      symbol: "",
      shares: "",
    },
  });

  const isOpen = buyDialog === "open";
  const selectedSymbol = form.watch("symbol");
  const shares = form.watch("shares");

  const currentWalletBalance =
    user?.walletBalances && user.walletBalances.length > 0
      ? user.walletBalances[user.walletBalances.length - 1].balance
      : 0;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setBuyDialog("open");
    } else {
      setBuyDialog(null);
      form.reset();
      setPurchaseError(null);
    }
  };

  const onSubmit = async (data: BuyAssetFormData) => {
    const selected = symbolsData?.data.find((s) => s.symbol === data.symbol);
    if (!selected) return;

    const totalCost = selected.price * Number(data.shares);

    // Client-side validation
    if (totalCost > currentWalletBalance) {
      setPurchaseError(
        `Insufficient funds. You need $${totalCost.toLocaleString()} but only have $${currentWalletBalance.toLocaleString()}`
      );
      return;
    }

    setPurchaseError(null);
    setIsSubmitting(true);

    try {
      await onBuy(
        selected.symbol,
        selected.name,
        selected.price,
        Number(data.shares)
      );

      // Close dialog and reset
      setBuyDialog(null);
      form.reset();
    } catch (error: any) {
      setPurchaseError(
        error.message || "Failed to complete purchase. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSymbolData = symbolsData?.data.find(
    (s) => s.symbol === selectedSymbol
  );
  const totalCost = selectedSymbolData
    ? selectedSymbolData.price * Number(shares || 0)
    : 0;
  const hasEnoughFunds = totalCost <= currentWalletBalance;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buy Asset</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Available Balance */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Available Balance:
                </span>
                <span className="font-semibold">
                  ${currentWalletBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || isError}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a symbol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <div className="p-2">
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : isError ? (
                        <div className="p-2 text-sm text-red-500">
                          Failed to load symbols
                        </div>
                      ) : (
                        symbolsData?.data.map((s) => (
                          <SelectItem key={s.symbol} value={s.symbol}>
                            {s.symbol} — {s.name} (${s.price.toFixed(2)})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shares"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Shares</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of shares"
                      min="1"
                      step="1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Summary */}
            {selectedSymbol &&
              shares &&
              !form.formState.errors.shares &&
              Number(shares) > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Price per share:
                      </span>
                      <span className="font-medium">
                        ${selectedSymbolData?.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shares:</span>
                      <span className="font-medium">{shares}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold">Total Cost:</span>
                        <span className="font-bold text-lg">
                          $
                          {totalCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {!hasEnoughFunds && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Insufficient funds. You need $
                            {(
                              totalCost - currentWalletBalance
                            ).toLocaleString()}{" "}
                            more.
                          </AlertDescription>
                        </Alert>
                      )}
                      {hasEnoughFunds && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Sufficient funds available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Error Alert */}
            {purchaseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{purchaseError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isLoading ||
                  !hasEnoughFunds ||
                  totalCost === 0
                }
              >
                {isSubmitting ? "Processing..." : "Confirm Purchase"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
