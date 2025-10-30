import Layout from "@/components/Layout";

export default function Home() {
  return (
    <Layout>
      <main className="p-10 text-center">
        <h1 className="text-3xl font-bold">Brokerage Challenge 🚀</h1>
        <p className="mt-4 text-gray-600">
          Navigate to{" "}
          <a href="/trade" className="text-blue-600 underline">
            /trade
          </a>{" "}
          or{" "}
          <a href="/portfolio" className="text-blue-600 underline">
            /portfolio
          </a>
        </p>
      </main>
    </Layout>
  );
}
