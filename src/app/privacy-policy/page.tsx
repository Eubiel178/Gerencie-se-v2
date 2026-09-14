import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Política de Privacidade — Gerencie-se",
};

const UPDATED_AT = "13 de setembro de 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Política de Privacidade" updatedAt={UPDATED_AT}>
      <p>
        O Gerencie-se é uma aplicação pessoal de organização e bem-estar (tarefas, rotina,
        hábitos, metas, foco, calendário, leitura, corrida, hidratação, saúde e ciclo
        menstrual). Esta política explica quais dados o app coleta, para que servem, com quem
        são compartilhados e quais direitos você tem sobre eles.
      </p>

      <h2>1. Quais dados coletamos</h2>
      <p>Só coletamos o que é necessário para o app funcionar:</p>
      <ul>
        <li>
          <strong>Dados de conta:</strong> nome e e-mail; senha (armazenada como hash, nunca em
          texto puro) se você criar conta por e-mail/senha, ou identificador do Google se você
          entrar com &ldquo;Continuar com Google&rdquo;.
        </li>
        <li>
          <strong>Conteúdo que você cria no app:</strong> tarefas, itens de rotina, hábitos e
          seus registros, metas, eventos, itens de leitura, sessões de corrida e de foco,
          registros de hidratação, anexos de arquivo enviados em tarefas.
        </li>
        <li>
          <strong>Dados de saúde (categoria sensível):</strong> check-ups de saúde e registros de
          ciclo menstrual, quando você opta por usar essas áreas. Esses dados só existem se você
          escolher preenchê-los, e ficam restritos à sua conta (nunca aparecem em áreas
          compartilhadas).
        </li>
        <li>
          <strong>Compartilhamento entre usuários:</strong> se você conectar sua conta a outra
          pessoa para compartilhar tarefas/rotina/hábitos/metas, guardamos o e-mail da pessoa
          convidada e o estado do convite (pendente, aceito, recusado).
        </li>
        <li>
          <strong>Integração com Google Agenda (opcional):</strong> se você conectar o Google
          Agenda, guardamos os tokens de acesso necessários para sincronizar eventos —
          criptografados em repouso, nunca em texto puro no banco.
        </li>
        <li>
          <strong>Preferências e metadados técnicos:</strong> fuso horário do seu navegador (para
          exibir horários corretamente), preferências de exibição (ex. gênero, usado só para
          decidir se a seção de ciclo menstrual aparece no menu), e registros de tentativas de
          login malsucedidas (usados apenas para te avisar por e-mail sobre tentativas suspeitas
          — nunca para bloquear sua conta).
        </li>
      </ul>

      <h2>2. Como usamos os dados</h2>
      <p>Usamos os dados exclusivamente para operar o app que você usa, o que inclui:</p>
      <ul>
        <li>Exibir, organizar e sincronizar o conteúdo que você cria.</li>
        <li>Autenticar seu acesso e manter sua sessão.</li>
        <li>
          Enviar e-mails que você mesmo ativa ou solicita: convite de compartilhamento, resumo
          semanal (opcional, desligado por padrão), aviso de tentativas de login, e redefinição
          de senha.
        </li>
        <li>Sincronizar eventos com o Google Agenda, quando você conecta essa integração.</li>
      </ul>
      <p>Não usamos seus dados para publicidade, não vendemos dados a terceiros, e não os usamos para treinar modelos de IA.</p>

      <h2>3. Com quem compartilhamos dados</h2>
      <p>
        Seus dados não são vendidos nem compartilhados para fins de marketing. Usamos os
        seguintes serviços de terceiros, estritamente para operar o app:
      </p>
      <ul>
        <li>
          <strong>Google</strong> — para login (&ldquo;Continuar com Google&rdquo;), opcionalmente para
          sincronizar eventos com o Google Agenda, e para o envio dos e-mails transacionais
          mencionados acima (convite, resumo semanal, avisos de segurança, redefinição de senha),
          que sai por uma conta de e-mail do projeto no Gmail.
        </li>
        <li>
          <strong>Provedor de hospedagem e de banco de dados</strong> — onde a aplicação e seus
          dados ficam armazenados.
        </li>
      </ul>
      <p>
        Outra pessoa só vê o seu conteúdo se você explicitamente compartilhar uma tarefa, item de
        rotina, hábito ou meta com ela através da funcionalidade de conexões — e mesmo assim, seus
        dados de saúde e ciclo menstrual nunca são compartilhados dessa forma.
      </p>

      <h2>4. Segurança</h2>
      <p>
        Senhas são armazenadas com hash (bcrypt), nunca em texto puro. Tokens de acesso do Google
        Agenda são criptografados em repouso. Toda comunicação em produção acontece via HTTPS.
        Nenhuma medida de segurança é infalível, mas levamos isso a sério.
      </p>

      <h2>5. Retenção e exclusão dos seus dados</h2>
      <p>
        Você pode exportar seus dados a qualquer momento, em Configurações → Exportar dados —
        uma lista por vez (tarefas, hábitos, etc.), em formato de planilha (compatível com Excel
        e Google Planilhas). Para solicitar a exclusão da sua conta e de todos os dados
        associados a ela, entre em contato pelo e-mail abaixo — hoje isso ainda não é um processo
        self-service dentro do app.
      </p>

      <h2>6. Seus direitos</h2>
      <p>
        Você pode, a qualquer momento: acessar os dados que temos sobre você (via exportação),
        corrigi-los diretamente no app, ou solicitar a exclusão deles entrando em contato. Se você
        conectou o Google Agenda, pode desconectar essa integração a qualquer momento em
        Configurações.
      </p>

      <h2>7. Crianças</h2>
      <p>O Gerencie-se não é direcionado a menores de 13 anos, e não coletamos intencionalmente dados de crianças.</p>

      <h2>8. Alterações a esta política</h2>
      <p>
        Podemos atualizar esta política ocasionalmente. A data no topo desta página sempre
        reflete a versão mais recente.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas sobre privacidade ou pedidos relacionados aos seus dados:{" "}
        <a href="mailto:segerenciese@gmail.com">segerenciese@gmail.com</a>
      </p>
    </LegalDocument>
  );
}
