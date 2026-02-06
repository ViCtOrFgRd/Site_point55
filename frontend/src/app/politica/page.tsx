'use client';

import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import styles from './politica.module.scss';

export default function PoliticaPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Política de Privacidade' }]} />

        <div className={styles.hero}>
          <h1>Política de Privacidade</h1>
          <p>Última atualização: 05 de fevereiro de 2026</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introdução</h2>
            <p>
              A Point55 se compromete a proteger a privacidade e os dados pessoais de seus usuários. 
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos 
              suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            
            <h3>2.1. Dados Fornecidos por Você</h3>
            <ul>
              <li>Nome completo</li>
              <li>CPF</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>Endereço de entrega</li>
              <li>Dados de pagamento (processados por gateways seguros)</li>
            </ul>

            <h3>2.2. Dados Coletados Automaticamente</h3>
            <ul>
              <li>Endereço IP</li>
              <li>Tipo de navegador</li>
              <li>Sistema operacional</li>
              <li>Páginas visitadas e tempo de permanência</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Finalidade do Uso dos Dados</h2>
            <p>Utilizamos seus dados para:</p>
            <ul>
              <li>Processar e gerenciar seus pedidos</li>
              <li>Enviar atualizações sobre o status do pedido</li>
              <li>Melhorar a experiência de navegação no site</li>
              <li>Enviar ofertas e promoções (com seu consentimento)</li>
              <li>Prevenir fraudes e garantir a segurança</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Realizar análises estatísticas e de mercado</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Compartilhamento de Dados</h2>
            <p>
              Seus dados pessoais não serão vendidos, alugados ou compartilhados com terceiros, 
              exceto nas seguintes situações:
            </p>
            <ul>
              <li><strong>Transportadoras:</strong> Para realizar a entrega dos produtos</li>
              <li><strong>Gateways de Pagamento:</strong> Para processar transações financeiras</li>
              <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou ordem judicial</li>
              <li><strong>Parceiros de Negócio:</strong> Apenas com seu consentimento explícito</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul>
              <li>Criptografia SSL em todas as transações</li>
              <li>Servidores seguros e protegidos</li>
              <li>Controle de acesso restrito aos dados</li>
              <li>Monitoramento constante de segurança</li>
              <li>Backups regulares e seguros</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Cookies</h2>
            <p>
              Utilizamos cookies para melhorar sua experiência de navegação. Você pode 
              gerenciar ou desativar cookies nas configurações do seu navegador. Tipos de cookies utilizados:
            </p>
            <ul>
              <li><strong>Essenciais:</strong> Necessários para o funcionamento do site</li>
              <li><strong>Funcionais:</strong> Melhoram a experiência de navegação</li>
              <li><strong>Analíticos:</strong> Ajudam a entender como você usa o site</li>
              <li><strong>Marketing:</strong> Usados para exibir anúncios relevantes</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>7. Seus Direitos (LGPD)</h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul>
              <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais</li>
              <li><strong>Correção:</strong> Atualizar dados incorretos ou incompletos</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Retirar o consentimento a qualquer momento</li>
              <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento dos seus dados</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato conosco através do e-mail: 
              <strong> privacidade@point55.com.br</strong>
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Retenção de Dados</h2>
            <p>
              Manteremos seus dados pessoais apenas pelo tempo necessário para cumprir as 
              finalidades descritas nesta política, ou conforme exigido por lei. Após esse período, 
              os dados serão excluídos ou anonimizados de forma segura.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Menores de Idade</h2>
            <p>
              Nosso site não é direcionado a menores de 18 anos. Não coletamos intencionalmente 
              dados de menores. Se descobrirmos que coletamos dados de um menor, excluiremos 
              essas informações imediatamente.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você 
              sobre mudanças significativas através do e-mail cadastrado ou por avisos em nosso site. 
              Recomendamos que revise esta política regularmente.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Encarregado de Dados (DPO)</h2>
            <p>
              Para questões relacionadas à privacidade e proteção de dados, entre em contato com 
              nosso Encarregado de Dados:
            </p>
            <div className={styles.contact}>
              <p><strong>E-mail:</strong> privacidade@point55.com.br</p>
              <p><strong>Telefone:</strong> (11) 99338-5579</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2>12. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato:
            </p>
            <div className={styles.contact}>
              <p><strong>Point55 Comércio de Roupas LTDA</strong></p>
              <p><strong>E-mail:</strong> contato@point55.com.br</p>
              <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
