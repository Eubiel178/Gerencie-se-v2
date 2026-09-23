import { Focus } from "@/features/focus";

interface FocusPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const params = await searchParams;
  const taskId = typeof params.taskId === "string" ? params.taskId : undefined;

  return <Focus taskId={taskId} />;
}
