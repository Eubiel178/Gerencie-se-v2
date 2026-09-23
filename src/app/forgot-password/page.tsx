import type { Metadata } from "next";

import { ForgotPassword } from "@/features/auth/forgot-password";

export const metadata: Metadata = {
  title: "Recuperar senha",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
