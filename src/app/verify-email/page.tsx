import { VerifyEmail } from "@/features/auth/verify-email";

interface VerifyEmailPageProps {
  searchParams: Promise<{ delivery?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { delivery } = await searchParams;

  return <VerifyEmail deliveryFailed={delivery === "failed"} />;
}
