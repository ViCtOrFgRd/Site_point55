'use client';

import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiTruck, FiPackage, FiMapPin, FiClock } from 'react-icons/fi';
import styles from './frete.module.scss';

export default function FretePage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Política de Frete' }]} />

        <div className={styles.hero}>
          <FiTruck className={styles.heroIcon} />
          <h1>Política de Frete</h1>
          <p>Entregamos para todo o Brasil com segurança e rapidez</p>
        </div>

        <div className={styles.content}>
          <section className={styles.highlight}>
            <div className={styles.highlightCard}>
              <FiTruck className={styles.icon} />
              <h3>Frete Grátis</h3>
              <p>Em compras acima de R$ 299,00 para todo o Brasil</p>
            </div>
            <div className={styles.highlightCard}>
              <FiPackage className={styles.icon} />
              <h3>Envio Rápido</h3>
              <p>Pedidos aprovados até 14h são postados no mesmo dia</p>
            </div>
            <div className={styles.highlightCard}>
              <FiClock className={styles.icon} />
              <h3>Rastreamento</h3>
              <p>Acompanhe seu pedido em tempo real</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Prazo de Entrega por Região</h2>
            <p>
              Os prazos abaixo são contados em dias úteis a partir da confirmação do pagamento 
              e postagem do pedido:
            </p>

            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div className={styles.tableCell}>Região</div>
                <div className={styles.tableCell}>Estados</div>
                <div className={styles.tableCell}>Prazo</div>
                <div className={styles.tableCell}>Custo</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <FiMapPin className={styles.iconSmall} />
                  <strong>Sudeste</strong>
                </div>
                <div className={styles.tableCell}>SP, RJ, MG, ES</div>
                <div className={styles.tableCell}>3 a 7 dias úteis</div>
                <div className={styles.tableCell}>A partir de R$ 15,00</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <FiMapPin className={styles.iconSmall} />
                  <strong>Sul</strong>
                </div>
                <div className={styles.tableCell}>PR, SC, RS</div>
                <div className={styles.tableCell}>5 a 10 dias úteis</div>
                <div className={styles.tableCell}>A partir de R$ 18,00</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <FiMapPin className={styles.iconSmall} />
                  <strong>Centro-Oeste</strong>
                </div>
                <div className={styles.tableCell}>GO, MT, MS, DF</div>
                <div className={styles.tableCell}>7 a 12 dias úteis</div>
                <div className={styles.tableCell}>A partir de R$ 20,00</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <FiMapPin className={styles.iconSmall} />
                  <strong>Nordeste</strong>
                </div>
                <div className={styles.tableCell}>BA, PE, CE, RN, AL, SE, PB, PI, MA</div>
                <div className={styles.tableCell}>8 a 14 dias úteis</div>
                <div className={styles.tableCell}>A partir de R$ 22,00</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <FiMapPin className={styles.iconSmall} />
                  <strong>Norte</strong>
                </div>
                <div className={styles.tableCell}>AM, PA, RO, AC, RR, AP, TO</div>
                <div className={styles.tableCell}>10 a 18 dias úteis</div>
                <div className={styles.tableCell}>A partir de R$ 25,00</div>
              </div>
            </div>

            <div className={styles.note}>
              <strong>Importante:</strong> Os valores de frete são calculados automaticamente 
              no carrinho com base no CEP e peso do pedido. Prazos podem variar conforme 
              disponibilidade dos Correios.
            </div>
          </section>

          <section className={styles.section}>
            <h2>Frete Grátis</h2>
            <p>
              Oferecemos <strong>frete grátis</strong> para todo o Brasil em compras acima de 
              <strong> R$ 299,00</strong>. O desconto é aplicado automaticamente no checkout 
              quando o valor mínimo é atingido.
            </p>
            <p>
              Durante períodos promocionais, podemos oferecer condições especiais de frete. 
              Fique atento às nossas redes sociais e newsletter para não perder as ofertas!
            </p>
          </section>

          <section className={styles.section}>
            <h2>Processamento e Postagem</h2>
            <h3>Tempo de Processamento</h3>
            <ul>
              <li>Pedidos com pagamento aprovado até <strong>14h</strong> são processados e postados no <strong>mesmo dia útil</strong></li>
              <li>Pedidos aprovados após 14h são postados no próximo dia útil</li>
              <li>Pedidos realizados em finais de semana e feriados são processados no próximo dia útil</li>
              <li>Boleto bancário: após confirmação do pagamento (até 3 dias úteis)</li>
            </ul>

            <h3>Código de Rastreamento</h3>
            <p>
              Assim que seu pedido for postado, você receberá um <strong>código de rastreamento</strong> por 
              e-mail e SMS. Com ele, você pode acompanhar a entrega em tempo real através do site 
              dos Correios ou na nossa <a href="/rastreio">página de rastreamento</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Transportadoras</h2>
            <p>
              Trabalhamos com as seguintes transportadoras para garantir que seu pedido chegue 
              com segurança:
            </p>
            <ul>
              <li><strong>Correios (PAC e SEDEX):</strong> Principal meio de envio para todo o Brasil</li>
              <li><strong>Jadlog:</strong> Regiões metropolitanas selecionadas</li>
              <li><strong>Total Express:</strong> Entregas expressas em capitais</li>
            </ul>
            <p>
              A transportadora é selecionada automaticamente com base no seu CEP, prazo e melhor custo-benefício.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Problemas com a Entrega</h2>
            <h3>Ausência no Recebimento</h3>
            <p>
              Se você não estiver presente no momento da entrega, a transportadora deixará um 
              aviso com instruções para retirada em agência ou reagendamento.
            </p>

            <h3>Extravio ou Atraso</h3>
            <p>
              Caso seu pedido não chegue dentro do prazo previsto ou seja extraviado:
            </p>
            <ul>
              <li>Entre em contato imediatamente através do nosso WhatsApp: <strong>(11) 99338-5579</strong></li>
              <li>Informe o número do pedido e código de rastreamento</li>
              <li>Nossa equipe iniciará a investigação junto à transportadora</li>
              <li>Se confirmado o extravio, reenviamos o pedido ou reembolsamos o valor</li>
            </ul>

            <h3>Endereço Incorreto</h3>
            <p>
              Confira cuidadosamente os dados de entrega antes de finalizar o pedido. 
              Não nos responsabilizamos por devoluções ou extravios causados por informações incorretas. 
              Caso precise alterar o endereço após a compra, entre em contato imediatamente.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Observações Importantes</h2>
            <ul>
              <li>Os prazos de entrega começam a contar após a confirmação do pagamento e postagem</li>
              <li>Não trabalhamos com entrega no mesmo dia ou agendamento de horário específico</li>
              <li>Entregas em áreas rurais ou de difícil acesso podem ter prazo adicional</li>
              <li>Durante períodos de alta demanda (Black Friday, Natal), os prazos podem ser estendidos</li>
              <li>Regiões atendidas por transportadoras alternativas terão prazos informados no checkout</li>
              <li>Produtos volumosos ou de grande peso podem ter condições especiais de frete</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Dúvidas sobre Frete?</h2>
            <p>
              Se tiver qualquer dúvida sobre frete, prazos ou rastreamento, entre em contato:
            </p>
            <div className={styles.contact}>
              <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
              <p><strong>E-mail:</strong> contato@point55.com.br</p>
              <p><strong>Horário:</strong> Segunda a sexta, 9h às 18h</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
