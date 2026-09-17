import { VerifyEmail } from "@/features/auth/verify-email";

interface VerifyEmailPageProps {
  searchParams: Promise<{ delivery?: string | string[]; resumed?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { delivery, resumed } = await searchParams;

  return <VerifyEmail deliveryFailed={delivery === "failed"} resumed={resumed === "1"} />;
}
