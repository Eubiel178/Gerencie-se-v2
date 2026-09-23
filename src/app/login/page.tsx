import type { Metadata } from "next";

import { Login } from "@/features/auth/login";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

export default function LoginPage() {
  return <Login />;
}
