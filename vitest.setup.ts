import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import ResizeObserver from "resize-observer-polyfill";

// Polyfill ResizeObserver for Recharts
global.ResizeObserver = ResizeObserver;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock nuqs
vi.mock("nuqs", () => ({
  useQueryState: () => [null, vi.fn()],
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => children,
}));