// src/app/page.test.tsx
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterAll, afterEach, beforeAll, test } from "vitest";
import Home from "./page";
import { AuthProvider } from "@/contexts/AuthContext";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Default handlers for all tests
const defaultHandlers = [
  http.get("/api/symbols", () =>
    HttpResponse.json({
      data: [
        { symbol: "AAPL", name: "Apple Inc.", price: 180.0 },
        { symbol: "TSLA", name: "Tesla Inc.", price: 250.0 },
        { symbol: "NVDA", name: "NVIDIA Corp.", price: 465.3 },
      ],
    })
  ),
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

test("displays empty state when user has no balance history", async () => {
  server.use(
    ...defaultHandlers,
    http.get("/api/me", () =>
      HttpResponse.json({
        id: "1",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      })
    ),
    http.get("/api/positions", () => HttpResponse.json([])),
    http.get("/api/wallet-balances", () => HttpResponse.json([])),
    http.get("/api/brokerage-values", () => HttpResponse.json([]))
  );

  render(<Home />, { wrapper: createWrapper() });

  const heading = await screen.findByText(/Welcome to Marketstack/i);
  expect(heading).toBeInTheDocument();

  const description = screen.getByText(/Start your investment journey/i);
  expect(description).toBeInTheDocument();

  const buyButton = screen.getByRole("button", {
    name: /Buy Your First Asset/i,
  });
  expect(buyButton).toBeInTheDocument();
});

test("displays dashboard with portfolio data", async () => {
  server.use(
    ...defaultHandlers,
    http.get("/api/me", () =>
      HttpResponse.json({
        id: "1",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      })
    ),
    http.get("/api/positions", () =>
      HttpResponse.json([
        {
          id: "pos1",
          symbol: "AAPL",
          name: "Apple Inc.",
          shares: 10,
          avgPrice: 150.0,
          currentPrice: 180.0,
        },
      ])
    ),
    http.get("/api/wallet-balances", () =>
      HttpResponse.json([
        {
          id: "wb1",
          date: new Date(Date.now() - 86400000).toISOString(),
          balance: 9000,
        },
        { id: "wb2", date: new Date().toISOString(), balance: 8500 },
      ])
    ),
    http.get("/api/brokerage-values", () =>
      HttpResponse.json([
        {
          id: "bv1",
          date: new Date(Date.now() - 86400000).toISOString(),
          value: 1000,
        },
        { id: "bv2", date: new Date().toISOString(), value: 1800 },
      ])
    )
  );

  render(<Home />, { wrapper: createWrapper() });

  const dashboardHeading = await screen.findByText("Dashboard");
  expect(dashboardHeading).toBeInTheDocument();

  const totalPortfolio = await screen.findByText(/\$10,300\.00/);
  expect(totalPortfolio).toBeInTheDocument();

  const portfolioDescription = screen.getByText(
    "Track your portfolio performance"
  );
  expect(portfolioDescription).toBeInTheDocument();
});

test("displays positions table with correct P&L calculations", async () => {
  server.use(
    ...defaultHandlers,
    http.get("/api/me", () =>
      HttpResponse.json({
        id: "1",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      })
    ),
    http.get("/api/positions", () =>
      HttpResponse.json([
        {
          id: "pos1",
          symbol: "AAPL",
          name: "Apple Inc.",
          shares: 10,
          avgPrice: 150.0,
          currentPrice: 180.0,
        },
      ])
    ),
    http.get("/api/wallet-balances", () =>
      HttpResponse.json([
        { id: "wb1", date: new Date().toISOString(), balance: 8500 },
      ])
    ),
    http.get("/api/brokerage-values", () =>
      HttpResponse.json([
        { id: "bv1", date: new Date().toISOString(), value: 1800 },
      ])
    )
  );

  render(<Home />, { wrapper: createWrapper() });

  const symbolCell = await screen.findByText("AAPL");
  expect(symbolCell).toBeInTheDocument();

  const nameCell = screen.getByText("Apple Inc.");
  expect(nameCell).toBeInTheDocument();

  const sharesCell = screen.getByText("10");
  expect(sharesCell).toBeInTheDocument();

  const avgPriceCell = screen.getByText("$150.00");
  expect(avgPriceCell).toBeInTheDocument();

  const currentPriceCell = screen.getByText("$180.00");
  expect(currentPriceCell).toBeInTheDocument();

  const profitCell = screen.getByText(/\+\$300\.00/);
  expect(profitCell).toBeInTheDocument();

  const profitPercentCell = screen.getByText(/\+20\.00%/);
  expect(profitPercentCell).toBeInTheDocument();
});

test("displays portfolio distribution percentages correctly", async () => {
  server.use(
    ...defaultHandlers,
    http.get("/api/me", () =>
      HttpResponse.json({
        id: "1",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      })
    ),
    http.get("/api/positions", () => HttpResponse.json([])),
    http.get("/api/wallet-balances", () =>
      HttpResponse.json([
        { id: "wb1", date: new Date().toISOString(), balance: 7500 },
      ])
    ),
    http.get("/api/brokerage-values", () =>
      HttpResponse.json([
        { id: "bv1", date: new Date().toISOString(), value: 2500 },
      ])
    )
  );

  render(<Home />, { wrapper: createWrapper() });

  const walletPercentage = await screen.findByText(/75\.0% of portfolio/);
  expect(walletPercentage).toBeInTheDocument();

  const brokeragePercentage = screen.getByText(/25\.0% of portfolio/);
  expect(brokeragePercentage).toBeInTheDocument();
});

test("shows empty positions message when user has no positions", async () => {
  server.use(
    ...defaultHandlers,
    http.get("/api/me", () =>
      HttpResponse.json({
        id: "1",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      })
    ),
    http.get("/api/positions", () => HttpResponse.json([])),
    http.get("/api/wallet-balances", () =>
      HttpResponse.json([
        { id: "wb1", date: new Date().toISOString(), balance: 10000 },
      ])
    ),
    http.get("/api/brokerage-values", () =>
      HttpResponse.json([
        { id: "bv1", date: new Date().toISOString(), value: 0 },
      ])
    )
  );

  render(<Home />, { wrapper: createWrapper() });

  const noPositionsHeading = await screen.findByText("No positions yet");
  expect(noPositionsHeading).toBeInTheDocument();

  const message = screen.getByText(
    /Start investing by buying your first asset/i
  );
  expect(message).toBeInTheDocument();
});
