"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingDown } from "lucide-react";

interface Position {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
}

const sellPositionSchema = z.object({
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

type SellPositionFormData = z.infer<typeof sellPositionSchema>;

interface SellPositionDialogProps {
  position: Position | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSell: (positionId: string, shares: number) => Promise<void>;
}

export function SellPositionDialog({
  position,
  open,
  onOpenChange,
  onSell,
}: SellPositionDialogProps) {
  const [sellError, setSellError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SellPositionFormData>({
    resolver: zodResolver(sellPositionSchema),
    defaultValues: {
      shares: "",
    },
  });

  const shares = form.watch("shares");
  const sharesToSell = Number(shares || 0);
  const hasEnoughShares = position ? sharesToSell <= position.shares : false;
  const totalValue = position ? position.currentPrice * sharesToSell : 0;
  const totalCost = position ? position.avgPrice * sharesToSell : 0;
  const profitLoss = totalValue - totalCost;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSellError(null);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: SellPositionFormData) => {
    if (!position) return;

    const sharesToSell = Number(data.shares);

    // Client-side validation
    if (sharesToSell > position.shares) {
      setSellError(`You only have ${position.shares} shares available to sell`);
      return;
    }

    setSellError(null);
    setIsSubmitting(true);

    try {
      await onSell(position.id, sharesToSell);
      handleOpenChange(false);
    } catch (error: any) {
      setSellError(
        error.message || "Failed to complete sale. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sell Position</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Position Info */}
            <div className="rounded-lg bg-muted p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-semibold">
                    {position.symbol} — {position.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Available Shares:
                  </span>
                  <span className="font-semibold">{position.shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-semibold">
                    ${position.currentPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="shares"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Shares to Sell</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of shares"
                      min="1"
                      max={position.shares}
                      step="1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sale Summary */}
            {shares && !form.formState.errors.shares && sharesToSell > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Price per share:
                    </span>
                    <span className="font-medium">
                      ${position.currentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares:</span>
                    <span className="font-medium">{sharesToSell}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Total Value:</span>
                      <span className="font-bold text-lg">
                        $
                        {totalValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Profit/Loss:
                      </span>
                      <span
                        className={`font-semibold ${
                          profitLoss >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {!hasEnoughShares && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You only have {position.shares} shares available.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {sellError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{sellError}</AlertDescription>
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
                variant="destructive"
                disabled={
                  isSubmitting || !hasEnoughShares || sharesToSell === 0
                }
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                {isSubmitting ? "Processing..." : "Confirm Sale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
