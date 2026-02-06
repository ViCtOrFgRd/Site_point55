'use client';

import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiHeart, FiTruck, FiShield, FiUsers } from 'react-icons/fi';
import styles from './sobre.module.scss';

export default function SobrePage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Sobre Nós' }]} />

        <div className={styles.hero}>
          <h1>Sobre a Point55</h1>
          <p className={styles.subtitle}>
            Moda, estilo e qualidade ao seu alcance
          </p>
        </div>

        <div className={styles.content}>
          {/* Nossa História */}
          <section className={styles.section}>
            <h2>Nossa História</h2>
            <p>
              A Point55 nasceu em 2020 com um propósito claro: democratizar a moda e 
              tornar o estilo acessível a todos. Começamos como uma pequena loja online 
              e, graças à confiança dos nossos clientes, nos tornamos uma das principais 
              referências em moda no Brasil.
            </p>
            <p>
              Hoje, atendemos milhares de clientes em todo o país, oferecendo produtos 
              de qualidade com os melhores preços do mercado. Nossa missão é fazer você 
              se sentir bem com o que veste, sem pesar no bolso.
            </p>
          </section>

          {/* Nossos Valores */}
          <section className={styles.section}>
            <h2>Nossos Valores</h2>
            <div className={styles.valuesGrid}>
              <div className={styles.valueCard}>
                <div className={styles.icon}>
                  <FiHeart size={40} />
                </div>
                <h3>Paixão pelo Cliente</h3>
                <p>
                  Colocamos nossos clientes em primeiro lugar. Sua satisfação é 
                  nossa maior recompensa.
                </p>
              </div>

              <div className={styles.valueCard}>
                <div className={styles.icon}>
                  <FiShield size={40} />
                </div>
                <h3>Qualidade Garantida</h3>
                <p>
                  Selecionamos cuidadosamente cada produto para garantir a melhor 
                  qualidade e durabilidade.
                </p>
              </div>

              <div className={styles.valueCard}>
                <div className={styles.icon}>
                  <FiTruck size={40} />
                </div>
                <h3>Entrega Rápida</h3>
                <p>
                  Trabalhamos com os melhores parceiros logísticos para entregar 
                  seus pedidos com agilidade e segurança.
                </p>
              </div>

              <div className={styles.valueCard}>
                <div className={styles.icon}>
                  <FiUsers size={40} />
                </div>
                <h3>Atendimento Humanizado</h3>
                <p>
                  Nossa equipe está sempre pronta para ajudar você com toda atenção 
                  e carinho que você merece.
                </p>
              </div>
            </div>
          </section>

          {/* Por que Escolher a Point55 */}
          <section className={styles.section}>
            <h2>Por que Escolher a Point55?</h2>
            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <h3>✨ Variedade de Produtos</h3>
                <p>
                  Milhares de produtos em diversas categorias: roupas femininas, 
                  masculinas, acessórios, calçados e muito mais.
                </p>
              </div>

              <div className={styles.benefit}>
                <h3>💰 Melhores Preços</h3>
                <p>
                  Oferecemos preços competitivos e promoções imperdíveis durante 
                  todo o ano. Compre mais pagando menos!
                </p>
              </div>

              <div className={styles.benefit}>
                <h3>🚚 Frete Grátis</h3>
                <p>
                  Frete grátis para compras acima de R$ 200,00. Economia garantida 
                  em suas compras.
                </p>
              </div>

              <div className={styles.benefit}>
                <h3>🔐 Compra Segura</h3>
                <p>
                  Site 100% seguro com certificado SSL. Seus dados estão protegidos 
                  em todas as transações.
                </p>
              </div>

              <div className={styles.benefit}>
                <h3>🔄 Trocas Facilitadas</h3>
                <p>
                  Não gostou? Sem problemas! Você tem 30 dias para solicitar a troca 
                  ou devolução do seu produto.
                </p>
              </div>

              <div className={styles.benefit}>
                <h3>📱 Atendimento via WhatsApp</h3>
                <p>
                  Tire suas dúvidas rapidamente pelo nosso WhatsApp. Estamos aqui 
                  para ajudar!
                </p>
              </div>
            </div>
          </section>

          {/* Contato */}
          <section className={styles.section}>
            <h2>Fale Conosco</h2>
            <p>
              Tem alguma dúvida ou sugestão? Entre em contato conosco:
            </p>
            <div className={styles.contact}>
              <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
              <p><strong>E-mail:</strong> contato@point55.com.br</p>
              <p><strong>Horário de Atendimento:</strong> Segunda a Sexta, das 9h às 19h</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
