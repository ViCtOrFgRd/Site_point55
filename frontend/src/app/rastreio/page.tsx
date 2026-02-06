'use client';

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiSearch, FiPackage, FiTruck, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import styles from './rastreio.module.scss';

export default function RastreioPage() {
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState('');

  const handleRastrear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigoRastreio.trim()) {
      setErro('Por favor, insira um código de rastreamento');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      // Simulação de busca - substituir por API real
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dados fictícios para demonstração
      setResultado({
        codigo: codigoRastreio.toUpperCase(),
        status: 'Em Trânsito',
        destino: 'São Paulo - SP',
        previsao: '07/02/2026',
        eventos: [
          {
            data: '05/02/2026 14:30',
            local: 'São Paulo - SP',
            situacao: 'Objeto saiu para entrega',
            icon: 'truck'
          },
          {
            data: '05/02/2026 08:15',
            local: 'Centro de Distribuição - São Paulo',
            situacao: 'Objeto em trânsito',
            icon: 'package'
          },
          {
            data: '04/02/2026 16:45',
            local: 'Unidade de Tratamento - Rio de Janeiro',
            situacao: 'Objeto encaminhado',
            icon: 'map'
          },
          {
            data: '04/02/2026 10:00',
            local: 'Agência dos Correios - Rio de Janeiro',
            situacao: 'Objeto postado',
            icon: 'check'
          }
        ]
      });
    } catch (error) {
      setErro('Erro ao buscar informações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'truck':
        return <FiTruck />;
      case 'package':
        return <FiPackage />;
      case 'map':
        return <FiMapPin />;
      case 'check':
        return <FiCheckCircle />;
      default:
        return <FiPackage />;
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Rastreamento de Pedidos' }]} />

        <div className={styles.hero}>
          <FiPackage className={styles.heroIcon} />
          <h1>Rastreamento de Pedidos</h1>
          <p>Acompanhe seu pedido em tempo real</p>
        </div>

        <div className={styles.content}>
          <section className={styles.searchSection}>
            <form onSubmit={handleRastrear} className={styles.searchForm}>
              <div className={styles.inputGroup}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Digite o código de rastreamento"
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value)}
                  className={styles.input}
                />
              </div>
              <button 
                type="submit" 
                className={styles.btnRastrear}
                disabled={loading}
              >
                {loading ? 'Buscando...' : 'Rastrear Pedido'}
              </button>
            </form>

            {erro && (
              <div className={styles.erro}>
                <p>{erro}</p>
              </div>
            )}
          </section>

          {resultado && (
            <section className={styles.resultSection}>
              <div className={styles.resultHeader}>
                <div className={styles.resultInfo}>
                  <h2>Código: {resultado.codigo}</h2>
                  <p className={styles.status}>{resultado.status}</p>
                </div>
                <div className={styles.resultDetails}>
                  <div className={styles.detail}>
                    <strong>Destino:</strong>
                    <span>{resultado.destino}</span>
                  </div>
                  <div className={styles.detail}>
                    <strong>Previsão de Entrega:</strong>
                    <span>{resultado.previsao}</span>
                  </div>
                </div>
              </div>

              <div className={styles.timeline}>
                <h3>Histórico de Movimentação</h3>
                {resultado.eventos.map((evento: any, index: number) => (
                  <div key={index} className={styles.timelineItem}>
                    <div className={styles.timelineIcon}>
                      {getIcon(evento.icon)}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDate}>{evento.data}</div>
                      <div className={styles.timelineSituacao}>{evento.situacao}</div>
                      <div className={styles.timelineLocal}>{evento.local}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2>Como Funciona o Rastreamento</h2>
            
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Encontre seu Código</h3>
                  <p>
                    Após a postagem do seu pedido, você receberá um <strong>código de 
                    rastreamento</strong> por e-mail e SMS. O código geralmente tem 13 
                    caracteres (formato: AA123456789BR).
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Digite o Código</h3>
                  <p>
                    Cole ou digite o código no campo de busca acima e clique em 
                    <strong> "Rastrear Pedido"</strong>. As informações serão atualizadas 
                    em tempo real.
                  </p>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Acompanhe a Entrega</h3>
                  <p>
                    Você verá o histórico completo de movimentação do seu pedido, desde 
                    a postagem até a entrega final. Verifique a previsão de chegada e 
                    o status atualizado.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Status Comuns de Rastreamento</h2>
            
            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <FiCheckCircle className={styles.statusIcon} style={{ color: '#10b981' }} />
                <div>
                  <h4>Objeto Postado</h4>
                  <p>Seu pedido foi enviado pela Point55 e registrado nos Correios</p>
                </div>
              </div>

              <div className={styles.statusItem}>
                <FiPackage className={styles.statusIcon} style={{ color: '#3b82f6' }} />
                <div>
                  <h4>Objeto em Trânsito</h4>
                  <p>Seu pedido está a caminho do centro de distribuição de destino</p>
                </div>
              </div>

              <div className={styles.statusItem}>
                <FiTruck className={styles.statusIcon} style={{ color: '#f59e0b' }} />
                <div>
                  <h4>Saiu para Entrega</h4>
                  <p>O carteiro está a caminho do endereço de entrega</p>
                </div>
              </div>

              <div className={styles.statusItem}>
                <FiCheckCircle className={styles.statusIcon} style={{ color: '#059669' }} />
                <div>
                  <h4>Objeto Entregue</h4>
                  <p>Seu pedido foi entregue com sucesso no endereço cadastrado</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Perguntas Frequentes</h2>
            
            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h3>Não recebi o código de rastreamento, o que fazer?</h3>
                <p>
                  Verifique sua caixa de spam ou lixo eletrônico. Se não encontrar, 
                  entre em contato conosco pelo WhatsApp <strong>(11) 99338-5579</strong> com 
                  o número do seu pedido.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>O rastreamento não atualiza há dias</h3>
                <p>
                  Algumas regiões podem ter atualizações menos frequentes. Se o pedido estiver 
                  sem atualização por mais de 5 dias úteis, entre em contato conosco para 
                  verificarmos junto à transportadora.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Código de rastreamento inválido</h3>
                <p>
                  Certifique-se de digitar o código completo e corretamente. Se o problema 
                  persistir, pode ser que o pedido ainda não tenha sido registrado no sistema 
                  dos Correios (aguarde algumas horas após receber o e-mail).
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Ausência no momento da entrega</h3>
                <p>
                  Se você não estiver presente, o carteiro deixará um aviso com instruções 
                  para retirada na agência ou reagendamento. Você também pode acompanhar pelo 
                  aplicativo dos Correios.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Rastreamento em Outros Sites</h2>
            <p>
              Você também pode rastrear seu pedido diretamente nos sites oficiais:
            </p>
            
            <div className={styles.linksList}>
              <a 
                href="https://www.correios.com.br/rastreamento" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <FiPackage />
                Rastreamento Correios
              </a>
              <a 
                href="https://www.jadlog.com.br/rastreamento" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <FiTruck />
                Rastreamento Jadlog
              </a>
              <a 
                href="https://www.totalexpress.com.br/rastreamento" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <FiTruck />
                Rastreamento Total Express
              </a>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Precisa de Ajuda?</h2>
            <p>
              Nossa equipe está pronta para ajudar com qualquer dúvida sobre rastreamento:
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
