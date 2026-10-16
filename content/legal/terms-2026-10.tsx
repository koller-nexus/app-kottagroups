import type { LegalDocumentContent } from "@/components/legal/legal-document";
import { LEGAL_UPDATED_AT, TERMS_VERSION } from "@/lib/legal";

export const terms: LegalDocumentContent = {
  version: TERMS_VERSION,
  updatedAt: LEGAL_UPDATED_AT,
  draft: true,
  sections: [
    {
      id: "aceitacao",
      title: "Aceitação",
      body: (
        <p>
          Ao criar uma conta ou usar o Kotta Groups, você concorda com estes Termos de Uso e com a nossa
          Política de Privacidade. Se não concordar, não use o serviço.
        </p>
      ),
    },
    {
      id: "o-servico",
      title: "O serviço",
      body: (
        <p>
          O Kotta Groups ajuda grupos de pessoas a registrar despesas compartilhadas, dividir valores, guardar notas
          fiscais e organizar listas de compras. O serviço é oferecido pela web.
        </p>
      ),
    },
    {
      id: "conta",
      title: "Conta e segurança",
      body: (
        <ul>
          <li>Você precisa informar um nome e um e-mail válidos e confirmar o e-mail.</li>
          <li>Você é responsável por manter sua senha em segredo e por tudo o que acontece na sua conta.</li>
          <li>Avise-nos se perceber uso não autorizado da sua conta.</li>
        </ul>
      ),
    },
    {
      id: "uso-permitido",
      title: "Uso permitido",
      body: (
        <ul>
          <li>Não use o serviço para atividades ilegais, fraude ou para prejudicar outras pessoas.</li>
          <li>Não tente acessar contas, grupos ou dados de outras pessoas sem permissão.</li>
          <li>Não sobrecarregue, copie ou tente contornar as proteções do serviço.</li>
        </ul>
      ),
    },
    {
      id: "conteudo",
      title: "Conteúdo que você envia",
      body: (
        <p>
          Despesas, notas fiscais, fotos e outras informações que você envia continuam sendo suas. Você nos autoriza a
          armazená-las e processá-las apenas para prestar o serviço, inclusive para ler notas fiscais automaticamente.
          Os membros dos seus grupos veem o conteúdo compartilhado nesses grupos.
        </p>
      ),
    },
    {
      id: "pagamentos",
      title: "Pix e pagamentos entre membros",
      body: (
        <p>
          O Kotta Groups mostra quanto cada pessoa deve e a chave Pix informada por quem vai receber. O Kotta Groups não
          processa pagamentos nem guarda dinheiro: os pagamentos acontecem fora do serviço, entre os membros.
        </p>
      ),
    },
    {
      id: "encerramento",
      title: "Suspensão e encerramento",
      body: (
        <p>
          Podemos suspender ou encerrar contas que violem estes termos. Você pode pedir a exclusão da sua conta a
          qualquer momento pelos canais indicados na Política de Privacidade.
        </p>
      ),
    },
    {
      id: "responsabilidade",
      title: "Limitação de responsabilidade",
      body: (
        <p>
          Trabalhamos para manter o serviço disponível e os cálculos corretos, mas ele é oferecido como está. Confira os
          valores antes de fazer pagamentos. Não respondemos por acordos feitos entre os membros dos grupos.
        </p>
      ),
    },
    {
      id: "mudancas",
      title: "Mudanças nestes termos",
      body: (
        <p>
          Podemos atualizar estes termos. A versão e a data da última atualização aparecem no topo desta página. Quando
          a mudança for relevante, pediremos que você aceite a nova versão.
        </p>
      ),
    },
    {
      id: "lei-e-contato",
      title: "Lei aplicável e contato",
      body: (
        <p>
          Estes termos seguem as leis brasileiras. Dúvidas podem ser enviadas para o contato indicado na Política de
          Privacidade.
        </p>
      ),
    },
  ],
};
