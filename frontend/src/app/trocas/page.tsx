'use client';

import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiRefreshCw, FiShield, FiBox, FiCheckCircle } from 'react-icons/fi';
import styles from './trocas.module.scss';

export default function TrocasPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Trocas e Devoluções' }]} />

        <div className={styles.hero}>
          <FiRefreshCw className={styles.heroIcon} />
          <h1>Trocas e Devoluções</h1>
          <p>Sua satisfação é nossa prioridade</p>
        </div>

        <div className={styles.content}>
          <section className={styles.highlight}>
            <div className={styles.highlightCard}>
              <FiShield className={styles.icon} />
              <h3>7 Dias de Garantia</h3>
              <p>Direito de arrependimento garantido por lei</p>
            </div>
            <div className={styles.highlightCard}>
              <FiBox className={styles.icon} />
              <h3>30 Dias para Trocar</h3>
              <p>Troque seu produto por tamanho ou modelo diferente</p>
            </div>
            <div className={styles.highlightCard}>
              <FiCheckCircle className={styles.icon} />
              <h3>Processo Simples</h3>
              <p>Solicite sua troca em poucos passos</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Direito de Arrependimento (7 dias)</h2>
            <p>
              Conforme o <strong>Código de Defesa do Consumidor (Art. 49)</strong>, você tem o 
              direito de desistir da compra em até <strong>7 dias corridos</strong> após o 
              recebimento do produto, sem necessidade de justificativa.
            </p>

            <h3>Como Funciona:</h3>
            <ul>
              <li>O prazo de 7 dias começa a contar a partir do recebimento do produto</li>
              <li>Você pode solicitar a devolução por qualquer motivo</li>
              <li>O produto deve estar sem uso, com etiquetas e embalagem original</li>
              <li>O valor pago será reembolsado integralmente, incluindo o frete</li>
              <li>O reembolso é feito em até 10 dias úteis após recebermos o produto</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Política de Trocas (30 dias)</h2>
            <p>
              Além do direito de arrependimento, oferecemos <strong>30 dias</strong> para trocar 
              produtos por tamanho ou modelo diferente, a partir da data de recebimento.
            </p>

            <h3>Produtos Aceitos para Troca:</h3>
            <ul>
              <li>Roupas com tamanho incorreto</li>
              <li>Produtos com defeito de fabricação</li>
              <li>Itens diferentes do pedido realizado</li>
              <li>Produtos danificados durante o transporte</li>
            </ul>

            <h3>Produtos Não Aceitos para Troca:</h3>
            <ul>
              <li>Roupas íntimas, lingeries e moda praia (por questões de higiene)</li>
              <li>Produtos com sinais de uso, lavagem ou alteração</li>
              <li>Itens sem etiqueta original ou embalagem danificada</li>
              <li>Produtos personalizados ou sob encomenda</li>
              <li>Acessórios com lacre violado</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Como Solicitar Troca ou Devolução</h2>
            
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Entre em Contato</h3>
                  <p>
                    Envie mensagem pelo WhatsApp <strong>(11) 99338-5579</strong> ou 
                    e-mail <strong>trocas@point55.com.br</strong> informando:
                  </p>
                  <ul>
                    <li>Número do pedido</li>
                    <li>Nome completo</li>
                    <li>Motivo da troca/devolução</li>
                    <li>Fotos do produto (se houver defeito)</li>
                  </ul>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Aguarde a Aprovação</h3>
                  <p>
                    Nossa equipe analisará sua solicitação em até <strong>24 horas úteis</strong> e 
                    enviará as instruções de postagem, incluindo o endereço e código de autorização.
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Envie o Produto</h3>
                  <p>
                    Embale o produto com cuidado, incluindo todos os acessórios, etiquetas e 
                    nota fiscal. Envie pelos Correios para o endereço fornecido.
                  </p>
                  <div className={styles.warning}>
                    <strong>Importante:</strong> Guarde o comprovante de postagem até a 
                    conclusão do processo.
                  </div>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3>Receba o Novo Produto ou Reembolso</h3>
                  <p>
                    Após recebermos e conferirmos o produto:
                  </p>
                  <ul>
                    <li><strong>Troca:</strong> Enviaremos o novo produto em até 3 dias úteis</li>
                    <li><strong>Devolução:</strong> Reembolso em até 10 dias úteis</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Custos de Frete</h2>
            
            <h3>Frete Grátis para Devolução (7 dias de arrependimento)</h3>
            <p>
              Se você exercer o direito de arrependimento dentro dos 7 dias, assumimos o 
              custo do frete de devolução. Enviaremos um código de postagem gratuito.
            </p>

            <h3>Trocas por Tamanho ou Modelo</h3>
            <p>
              Para trocas por motivos não relacionados a defeito ou erro nosso:
            </p>
            <ul>
              <li>O frete de devolução é por conta do cliente</li>
              <li>O frete do novo produto segue as condições normais de envio</li>
              <li>Frete grátis se a nova compra atingir o valor mínimo (R$ 299,00)</li>
            </ul>

            <h3>Defeito de Fabricação ou Erro Nosso</h3>
            <p>
              Se o produto apresentar defeito ou enviamos item errado:
            </p>
            <ul>
              <li>Todos os custos de frete são por nossa conta</li>
              <li>Enviaremos etiqueta de postagem reversa gratuita</li>
              <li>Nova entrega sem custo adicional</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Formas de Reembolso</h2>
            <p>
              O reembolso é processado de acordo com a forma de pagamento original:
            </p>

            <div className={styles.refundOptions}>
              <div className={styles.refundCard}>
                <h3>Cartão de Crédito</h3>
                <p>
                  O estorno é feito na fatura do cartão em até <strong>2 faturas</strong> após 
                  a confirmação da devolução. O prazo depende da operadora do cartão.
                </p>
              </div>

              <div className={styles.refundCard}>
                <h3>PIX ou Boleto</h3>
                <p>
                  Reembolso via PIX na chave cadastrada ou transferência bancária em até 
                  <strong> 10 dias úteis</strong> após a confirmação da devolução.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Produtos com Defeito</h2>
            <p>
              Se você receber um produto com defeito de fabricação:
            </p>
            <ul>
              <li>Entre em contato imediatamente com fotos que evidenciem o problema</li>
              <li>Não é necessário enviar o produto para análise em alguns casos</li>
              <li>Avaliaremos remotamente e, se confirmado, enviaremos um novo produto</li>
              <li>Se preferir, pode solicitar reembolso integral</li>
              <li>Todos os custos são por nossa conta</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Condições Importantes</h2>
            <div className={styles.conditions}>
              <div className={styles.conditionItem}>
                <FiCheckCircle className={styles.conditionIcon} />
                <div>
                  <h4>Produto sem Uso</h4>
                  <p>O item não pode ter sinais de uso, lavagem ou alteração</p>
                </div>
              </div>

              <div className={styles.conditionItem}>
                <FiCheckCircle className={styles.conditionIcon} />
                <div>
                  <h4>Etiquetas Originais</h4>
                  <p>Todas as etiquetas devem estar fixadas no produto</p>
                </div>
              </div>

              <div className={styles.conditionItem}>
                <FiCheckCircle className={styles.conditionIcon} />
                <div>
                  <h4>Embalagem Original</h4>
                  <p>Produto deve estar na embalagem original ou similar</p>
                </div>
              </div>

              <div className={styles.conditionItem}>
                <FiCheckCircle className={styles.conditionIcon} />
                <div>
                  <h4>Nota Fiscal</h4>
                  <p>Inclua a nota fiscal ou cupom de compra</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Endereço para Devolução</h2>
            <div className={styles.address}>
              <p><strong>Point55 - Trocas e Devoluções</strong></p>
              <p>Rua das Flores, 123 - Centro</p>
              <p>São Paulo - SP, CEP: 01234-567</p>
              <p className={styles.note}>
                <strong>Atenção:</strong> Não envie produtos sem autorização prévia. 
                Sempre solicite o código de autorização antes de postar.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Dúvidas ou Problemas?</h2>
            <p>
              Nossa equipe está pronta para ajudar você em todo o processo de troca ou devolução:
            </p>
            <div className={styles.contact}>
              <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
              <p><strong>E-mail:</strong> trocas@point55.com.br</p>
              <p><strong>Horário:</strong> Segunda a sexta, 9h às 18h</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
