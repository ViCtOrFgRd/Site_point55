'use client';

import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import styles from './termos.module.scss';

export default function TermosPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Termos de Uso' }]} />

        <div className={styles.hero}>
          <h1>Termos de Uso</h1>
          <p>Última atualização: 05 de fevereiro de 2026</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o site Point55 (k2on.casa), você concorda em cumprir e estar 
              sujeito aos seguintes Termos de Uso. Se você não concordar com qualquer parte destes 
              termos, não utilize nosso site ou serviços.
            </p>
            <p>
              Estes termos constituem um acordo legal entre você (usuário) e a Point55 Comércio de 
              Roupas LTDA. Ao criar uma conta, realizar compras ou interagir com nosso site, você 
              confirma que leu, compreendeu e aceitou estes termos.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Definições</h2>
            <ul>
              <li><strong>Site:</strong> Plataforma online Point55 (k2on.casa)</li>
              <li><strong>Usuário:</strong> Qualquer pessoa que acesse ou utilize o site</li>
              <li><strong>Cliente:</strong> Usuário que realiza compras no site</li>
              <li><strong>Produtos:</strong> Roupas, acessórios e itens disponíveis para venda</li>
              <li><strong>Pedido:</strong> Solicitação de compra realizada pelo cliente</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Cadastro e Conta</h2>
            <h3>3.1. Informações de Cadastro</h3>
            <p>
              Para realizar compras, você deve criar uma conta fornecendo informações verdadeiras, 
              precisas e atualizadas. Você é responsável por manter a confidencialidade de sua senha 
              e por todas as atividades realizadas em sua conta.
            </p>

            <h3>3.2. Responsabilidades do Usuário</h3>
            <ul>
              <li>Fornecer dados pessoais verdadeiros e atualizados</li>
              <li>Manter a segurança de suas credenciais de acesso</li>
              <li>Notificar imediatamente sobre uso não autorizado da conta</li>
              <li>Não compartilhar sua conta com terceiros</li>
              <li>Ser maior de 18 anos ou ter autorização dos responsáveis legais</li>
            </ul>

            <h3>3.3. Suspensão e Encerramento</h3>
            <p>
              Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, 
              apresentem atividades fraudulentas ou comportamentos inadequados.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Uso do Site</h2>
            <h3>4.1. Uso Permitido</h3>
            <p>Você concorda em utilizar o site apenas para:</p>
            <ul>
              <li>Visualizar e comprar produtos disponíveis</li>
              <li>Acessar informações sobre produtos e serviços</li>
              <li>Gerenciar seus pedidos e dados pessoais</li>
              <li>Entrar em contato com nosso suporte</li>
            </ul>

            <h3>4.2. Uso Proibido</h3>
            <p>É estritamente proibido:</p>
            <ul>
              <li>Usar o site para atividades ilegais ou fraudulentas</li>
              <li>Tentar acessar áreas restritas sem autorização</li>
              <li>Realizar engenharia reversa ou copiar o código do site</li>
              <li>Usar bots, scrapers ou ferramentas automatizadas</li>
              <li>Transmitir vírus, malware ou código malicioso</li>
              <li>Realizar ataques de negação de serviço (DDoS)</li>
              <li>Violar direitos de propriedade intelectual</li>
              <li>Fazer uso comercial não autorizado do conteúdo</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Produtos e Preços</h2>
            <h3>5.1. Disponibilidade</h3>
            <p>
              Todos os produtos estão sujeitos à disponibilidade de estoque. Reservamo-nos o direito 
              de limitar quantidades e descontinuar produtos sem aviso prévio.
            </p>

            <h3>5.2. Preços</h3>
            <p>
              Os preços são exibidos em reais (R$) e podem ser alterados sem aviso prévio. 
              Erros de precificação serão corrigidos, e você será notificado antes do processamento 
              do pedido. Promoções são válidas por tempo limitado e sujeitas a condições específicas.
            </p>

            <h3>5.3. Descrições e Imagens</h3>
            <p>
              Fazemos o possível para apresentar descrições e imagens precisas, mas não garantimos 
              que todas as informações estejam completamente livres de erros. Cores podem variar 
              devido a configurações de tela.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Pedidos e Pagamentos</h2>
            <h3>6.1. Processamento de Pedidos</h3>
            <p>
              Ao realizar um pedido, você faz uma oferta de compra. Reservamo-nos o direito de 
              aceitar ou recusar pedidos. A confirmação será enviada por e-mail após a aprovação 
              do pagamento.
            </p>

            <h3>6.2. Formas de Pagamento</h3>
            <p>
              Aceitamos cartões de crédito, PIX e boleto bancário. Todos os pagamentos são 
              processados por gateways seguros de terceiros.
            </p>

            <h3>6.3. Cancelamento de Pedidos</h3>
            <p>
              Pedidos podem ser cancelados antes do envio. Após o envio, aplicam-se as políticas 
              de troca e devolução.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Entrega</h2>
            <p>
              Os prazos de entrega são estimados e começam a contar após a confirmação do pagamento. 
              Não nos responsabilizamos por atrasos causados por transportadoras, eventos de força 
              maior ou informações de endereço incorretas.
            </p>
            <p>
              Para mais informações, consulte nossa <a href="/frete">Política de Frete</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Trocas e Devoluções</h2>
            <p>
              Você tem o direito de solicitar a troca ou devolução de produtos em até 7 dias após 
              o recebimento, conforme o Código de Defesa do Consumidor (Art. 49).
            </p>
            <p>
              Para mais detalhes, consulte nossa <a href="/trocas">Política de Trocas e Devoluções</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do site, incluindo textos, imagens, logos, gráficos, vídeos e código, 
              é propriedade da Point55 ou de seus licenciadores e está protegido por leis de 
              direitos autorais e propriedade intelectual.
            </p>
            <p>
              É proibida a reprodução, distribuição ou uso comercial sem autorização expressa.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Limitação de Responsabilidade</h2>
            <p>
              A Point55 não se responsabiliza por:
            </p>
            <ul>
              <li>Danos indiretos, incidentais ou consequenciais</li>
              <li>Perda de dados ou lucros cessantes</li>
              <li>Interrupções ou falhas temporárias do site</li>
              <li>Ações de terceiros (transportadoras, gateways de pagamento)</li>
              <li>Uso inadequado dos produtos adquiridos</li>
            </ul>
            <p>
              Nossa responsabilidade máxima limita-se ao valor pago pelo produto.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Links de Terceiros</h2>
            <p>
              Nosso site pode conter links para sites de terceiros. Não nos responsabilizamos 
              pelo conteúdo, políticas ou práticas desses sites. O acesso é por sua conta e risco.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
              Alterações significativas serão comunicadas por e-mail ou aviso no site. O uso 
              continuado do site após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className={styles.section}>
            <h2>13. Lei Aplicável e Foro</h2>
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer 
              disputas serão resolvidas no foro da comarca de São Paulo/SP, renunciando-se a 
              qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className={styles.section}>
            <h2>14. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <div className={styles.contact}>
              <p><strong>Point55 Comércio de Roupas LTDA</strong></p>
              <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
              <p><strong>E-mail:</strong> contato@point55.com.br</p>
              <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
              <p><strong>Horário:</strong> Segunda a sexta, 9h às 18h</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
