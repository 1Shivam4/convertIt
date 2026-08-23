import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// MSW server for Node.js (used in Vitest — not the browser Service Worker)
export const server = setupServer(...handlers);
