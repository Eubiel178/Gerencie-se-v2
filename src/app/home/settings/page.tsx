import { Settings } from "@/@core/presentation/settings";

interface SettingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  return <Settings searchParams={await searchParams} />;
}
