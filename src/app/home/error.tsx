"use client";

import { useEffect } from "react";

import { Wrapper, Paragraph, Button } from "@/components";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log técnico para depuração — o usuário só vê a mensagem amigável abaixo.
    console.error(error);
  }, [error]);

  return (
    <Wrapper direction="column" align="center" gap="medium" padding="xlarge">
      <Paragraph>
        Não conseguimos carregar suas informações agora. Verifique sua
        conexão e tente novamente.
      </Paragraph>

      <Button onClick={reset}>Tentar novamente</Button>
    </Wrapper>
  );
}
