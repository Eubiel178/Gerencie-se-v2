import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = {
  title: "Termos de Serviço — Gerencie-se",
};

const UPDATED_AT = "13 de setembro de 2026";

export default function TermsOfServicePage() {
  return (
    <LegalDocument title="Termos de Serviço" updatedAt={UPDATED_AT}>
      <p>
        Estes termos regem o uso do Gerencie-se. Ao criar uma conta, você concorda com eles. Se
        você não concordar, não utilize o app.
      </p>

      <h2>1. O que é o serviço</h2>
      <p>
        O Gerencie-se é uma aplicação pessoal de organização e bem-estar: tarefas, rotina,
        hábitos, metas, foco, calendário, leitura, corrida, hidratação, saúde e ciclo menstrual.
        É um projeto independente, não afiliado ao Google nem a nenhum outro serviço com o qual se
        integra.
      </p>

      <h2>2. Sua conta</h2>
      <p>
        Você é responsável por manter a confidencialidade da sua senha e por toda atividade que
        acontecer na sua conta. Avise-nos imediatamente se suspeitar de acesso não autorizado. Uma
        conta é de uso pessoal — não crie contas em nome de terceiros sem autorização deles.
      </p>

      <h2>3. Uso aceitável</h2>
      <p>Ao usar o Gerencie-se, você concorda em não:</p>
      <ul>
        <li>Usar o serviço para fins ilegais ou para violar direitos de terceiros;</li>
        <li>
          Tentar acessar dados de outra conta sem autorização, ou contornar limites técnicos e de
          segurança do app;
        </li>
        <li>Sobrecarregar a infraestrutura do serviço de propósito (ex. automação abusiva);</li>
        <li>Enviar convites de compartilhamento a pessoas sem relação com você.</li>
      </ul>

      <h2>4. Seu conteúdo</h2>
      <p>
        Tudo que você registra no app (tarefas, hábitos, metas, dados de saúde, etc.) pertence a
        você. Nós só o armazenamos e processamos para fornecer o serviço, conforme descrito na{" "}
        <a href="/privacy-policy">Política de Privacidade</a>. Se você compartilhar um item com
        outra pessoa através da funcionalidade de conexões, essa pessoa passa a poder vê-lo e, em
        alguns casos, editá-lo — a responsabilidade por decidir o que compartilhar é sua.
      </p>

      <h2>5. Integrações de terceiros</h2>
      <p>
        O login e a sincronização com Google Agenda dependem de serviços do Google, sujeitos aos
        próprios termos deles. O envio de e-mails depende de um provedor terceiro (Resend). Não
        somos responsáveis por indisponibilidade desses serviços externos.
      </p>

      <h2>6. Disponibilidade do serviço</h2>
      <p>
        O Gerencie-se é oferecido &ldquo;como está&rdquo;, sem garantia de disponibilidade contínua ou livre
        de erros. Por ser um projeto pessoal, não há SLA (acordo formal de nível de serviço).
        Fazemos o possível para manter tudo funcionando, mas não garantimos que o serviço estará
        sempre disponível, nem nos responsabilizamos por perdas decorrentes de indisponibilidade.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Na máxima extensão permitida por lei, o Gerencie-se e seus responsáveis não se
        responsabilizam por danos indiretos, incidentais ou consequenciais decorrentes do uso ou
        da impossibilidade de uso do serviço, incluindo perda de dados — por isso recomendamos
        exportar seus dados periodicamente (Configurações → Exportar dados).
      </p>

      <h2>8. Encerramento</h2>
      <p>
        Você pode parar de usar o serviço a qualquer momento. Para excluir sua conta e os dados
        associados a ela, entre em contato pelo e-mail abaixo. Podemos suspender ou encerrar
        contas que violem estes termos.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Podemos atualizar estes termos ocasionalmente. A data no topo desta página sempre reflete
        a versão mais recente. O uso continuado do serviço após uma alteração significa que você
        aceita os novos termos.
      </p>

      <h2>10. Lei aplicável</h2>
      <p>Estes termos são regidos pelas leis do Brasil.</p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas sobre estes termos: <a href="mailto:segerenciese@gmail.com">segerenciese@gmail.com</a>
      </p>
    </LegalDocument>
  );
}
