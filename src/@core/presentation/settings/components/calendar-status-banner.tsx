import { Feedback } from "@/components";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:
    "A conexão com o Google Agenda foi cancelada. Você pode tentar novamente quando quiser.",
  invalid_state:
    "Não foi possível confirmar a solicitação de conexão (ela pode ter expirado). Tente conectar novamente.",
  connect_failed:
    "Não foi possível concluir a conexão com o Google Agenda agora. Tente novamente em instantes.",
  not_configured:
    "A integração com o Google Agenda ainda não foi configurada neste ambiente. Veja GOOGLE_SETUP.md.",
};

interface CalendarStatusBannerProps {
  connected?: string;
  error?: string;
}

/** Mensagens de retorno do fluxo de conexão (`/api/google-calendar/callback`).
 * Nunca é um erro fatal — o resto do app continua funcionando normalmente
 * mesmo quando a conexão falha ou é cancelada. */
export function CalendarStatusBanner({
  connected,
  error,
}: CalendarStatusBannerProps) {
  if (connected) {
    return <Feedback type="success">Google Agenda conectado com sucesso.</Feedback>;
  }

  if (error) {
    return (
      <Feedback type="error">
        {ERROR_MESSAGES[error] ?? "Não foi possível conectar ao Google Agenda."}
      </Feedback>
    );
  }

  return null;
}
