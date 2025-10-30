import { OrderForm } from "@/components/OrderForm";
import { OrdersTable } from "@/components/OrdersTable";
import { PriceTicker } from "@/components/PriceTicker";

export default function TradePage() {
  return (
    <main className="p-10 flex flex-col gap-8 items-center">
      <PriceTicker />
      <OrderForm />
      <OrdersTable />
    </main>
  );
}

