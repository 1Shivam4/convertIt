"use client";

import { createAuthClient } from "better-auth/react";

// In the browser, omitting baseURL uses relative requests (/api/auth) matching the active domain (localhost or ngrok).
export const authClient = createAuthClient();

// Convenience named exports for common actions
export const { signIn, signUp, signOut, useSession } = authClient;
