import type { Metadata } from "next";

import { ResetPassword } from "@/features/auth/reset-password";

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
