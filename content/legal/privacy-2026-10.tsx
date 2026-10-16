import type { LegalDocumentContent } from "@/components/legal/legal-document";
import { LEGAL_UPDATED_AT, PRIVACY_VERSION } from "@/lib/legal";

export const privacy: LegalDocumentContent = {
  version: PRIVACY_VERSION,
  updatedAt: LEGAL_UPDATED_AT,
  draft: true,
  sections: [
    {
      id: "controlador",
      title: "Quem é o controlador e como falar com o encarregado",
      body: (
        <p>
          O Kotta Groups é o controlador dos dados pessoais tratados no serviço. O encarregado pelo tratamento de dados
          (DPO) pode ser contatado pelo e-mail <strong>privacidade@kottagroups.com.br</strong>.
        </p>
      ),
    },
    {
      id: "dados-coletados",
      title: "Dados que coletamos",
      body: (
        <ul>
          <li>Dados da conta: nome, e-mail, senha (guardada de forma cifrada), chave Pix e foto de perfil.</li>
          <li>Dados de uso do serviço: grupos, membros, despesas, divisões, categorias e listas de compras.</li>
          <li>Notas fiscais e NFC-e, e as imagens ou arquivos que você envia.</li>
          <li>Dados técnicos: endereço IP, tipo de navegador, registros de acesso e de erros.</li>
        </ul>
      ),
    },
    {
      id: "finalidades",
      title: "Para que usamos os dados e com qual base legal",
      body: (
        <ul>
          <li>Criar e manter sua conta e prestar o serviço: execução de contrato (art. 7º, V, da LGPD).</li>
          <li>Enviar e-mails de confirmação e de recuperação de senha: execução de contrato.</li>
          <li>Ler notas fiscais automaticamente para preencher despesas: execução de contrato.</li>
          <li>Manter registros de acesso e prevenir fraudes: cumprimento de obrigação legal e legítimo interesse (art. 7º, II e IX).</li>
          <li>Medir o uso de forma agregada para melhorar o serviço: legítimo interesse.</li>
        </ul>
      ),
    },
    {
      id: "compartilhamento",
      title: "Com quem compartilhamos",
      body: (
        <>
          <p>Compartilhamos dados apenas com operadores que nos ajudam a prestar o serviço:</p>
          <ul>
            <li>Hospedagem do site (Vercel).</li>
            <li>Armazenamento de arquivos e banco de dados (Oracle Cloud Infrastructure).</li>
            <li>Envio de e-mails transacionais.</li>
            <li>Monitoramento de erros (Sentry).</li>
            <li>Leitura de notas fiscais por inteligência artificial e OCR, via OpenRouter e os provedores de modelos que ele usa.</li>
          </ul>
          <p>Os membros dos seus grupos veem seu nome, sua foto, sua chave Pix e o que você registra nesses grupos.</p>
        </>
      ),
    },
    {
      id: "retencao",
      title: "Por quanto tempo guardamos",
      body: (
        <p>
          Guardamos os dados enquanto sua conta existir. Depois da exclusão, apagamos ou anonimizamos os dados, exceto
          os registros de acesso, guardados por 6 meses como exige o Marco Civil da Internet, e o que a lei obrigar a
          manter por mais tempo.
        </p>
      ),
    },
    {
      id: "direitos",
      title: "Seus direitos",
      body: (
        <>
          <p>
            Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização
            ou exclusão, portabilidade, informação sobre compartilhamento e revogação do consentimento, quando for o caso.
          </p>
          <p>
            Para exercer esses direitos, escreva para o e-mail do encarregado. Respondemos em até 15 dias. Você também
            pode corrigir nome, chave Pix e foto no Perfil.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      body: (
        <ul>
          <li>
            <strong>kotta_session</strong>: cookie estritamente necessário, mantém você conectado. Vence junto com a
            sessão.
          </li>
          <li>Vercel Analytics: mede visitas de forma agregada, sem identificar você.</li>
        </ul>
      ),
    },
    {
      id: "transferencia-internacional",
      title: "Transferência internacional",
      body: (
        <p>
          Alguns operadores processam dados fora do Brasil, como hospedagem, monitoramento de erros e provedores de
          inteligência artificial. Nesses casos, exigimos garantias adequadas de proteção, conforme o art. 33 da LGPD.
        </p>
      ),
    },
  ],
};
