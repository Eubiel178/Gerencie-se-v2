import type { Metadata } from "next";

import { Register } from "@/features/auth/register";

export const metadata: Metadata = {
  title: "Criar conta",
  robots: { index: false },
};

export default function RegisterPage() {
  return <Register />;
}
