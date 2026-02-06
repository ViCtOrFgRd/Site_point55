'use client';

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './faq.module.scss';

interface FAQItem {
  pergunta: string;
  resposta: string;
  categoria: string;
}

export default function FAQPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');

  const faqs: FAQItem[] = [
    // Pedidos e Pagamento
    {
      categoria: 'pedidos',
      pergunta: 'Como faço um pedido?',
      resposta: 'Para fazer um pedido, navegue pelo site, adicione os produtos desejados ao carrinho e clique em "Finalizar Compra". Preencha seus dados de entrega e escolha a forma de pagamento.'
    },
    {
      categoria: 'pedidos',
      pergunta: 'Quais são as formas de pagamento aceitas?',
      resposta: 'Aceitamos cartões de crédito (Visa, Mastercard, Elo), PIX e boleto bancário. No cartão de crédito você pode parcelar em até 3x sem juros.'
    },
    {
      categoria: 'pedidos',
      pergunta: 'Posso cancelar meu pedido?',
      resposta: 'Sim! Você pode cancelar seu pedido antes dele ser enviado. Acesse "Meus Pedidos" em seu perfil e clique em "Cancelar Pedido". Após o envio, entre em contato conosco.'
    },
    {
      categoria: 'pedidos',
      pergunta: 'Como uso um cupom de desconto?',
      resposta: 'Na página de checkout, você encontrará um campo para inserir o código do cupom. Digite o código e clique em "Aplicar". O desconto será aplicado automaticamente.'
    },

    // Entrega
    {
      categoria: 'entrega',
      pergunta: 'Qual o prazo de entrega?',
      resposta: 'O prazo varia de acordo com sua região. Em média, são 7 a 15 dias úteis. Você pode acompanhar o status do seu pedido em "Meus Pedidos".'
    },
    {
      categoria: 'entrega',
      pergunta: 'O frete é grátis?',
      resposta: 'Sim! Para compras acima de R$ 200,00, o frete é totalmente grátis para todo o Brasil. Compras abaixo desse valor têm frete de R$ 15,00.'
    },
    {
      categoria: 'entrega',
      pergunta: 'Como rastreio meu pedido?',
      resposta: 'Após o envio, você receberá um código de rastreamento por e-mail. Você também pode acompanhar o status em "Meus Pedidos" ou na página "Rastrear Pedido".'
    },
    {
      categoria: 'entrega',
      pergunta: 'Vocês entregam em todo o Brasil?',
      resposta: 'Sim! Entregamos em todos os estados do Brasil, incluindo regiões remotas. O prazo pode variar de acordo com a localidade.'
    },

    // Trocas e Devoluções
    {
      categoria: 'trocas',
      pergunta: 'Como funciona a troca?',
      resposta: 'Você tem 30 dias corridos para solicitar a troca. O produto deve estar sem uso, com etiquetas e na embalagem original. Entre em contato pelo WhatsApp para iniciar o processo.'
    },
    {
      categoria: 'trocas',
      pergunta: 'Posso devolver um produto?',
      resposta: 'Sim! Dentro de 7 dias corridos após o recebimento, você pode devolver qualquer produto sem necessidade de justificativa (direito de arrependimento).'
    },
    {
      categoria: 'trocas',
      pergunta: 'Quem paga o frete da troca?',
      resposta: 'Se o produto apresentar defeito ou erro no envio, nós arcamos com os custos. Em casos de arrependimento, o frete fica por conta do cliente.'
    },
    {
      categoria: 'trocas',
      pergunta: 'Quanto tempo demora para processar a troca?',
      resposta: 'Após recebermos o produto, analisamos em até 5 dias úteis. Aprovada a troca, o novo produto é enviado em até 3 dias úteis.'
    },

    // Produtos
    {
      categoria: 'produtos',
      pergunta: 'Como escolho o tamanho certo?',
      resposta: 'Cada produto tem uma tabela de medidas na página de detalhes. Consulte a "Tabela de Medidas" e tire suas medidas antes de comprar.'
    },
    {
      categoria: 'produtos',
      pergunta: 'Os produtos são originais?',
      resposta: 'Sim! Todos os nossos produtos são originais e de alta qualidade. Trabalhamos apenas com fornecedores certificados.'
    },
    {
      categoria: 'produtos',
      pergunta: 'Posso comprar sem fazer cadastro?',
      resposta: 'Não. Para garantir a segurança e rastreabilidade dos pedidos, é necessário criar uma conta. O cadastro é rápido e gratuito!'
    },
    {
      categoria: 'produtos',
      pergunta: 'Os produtos têm garantia?',
      resposta: 'Sim! Todos os produtos têm garantia contra defeitos de fabricação conforme o Código de Defesa do Consumidor.'
    },

    // Conta e Segurança
    {
      categoria: 'conta',
      pergunta: 'Como crio uma conta?',
      resposta: 'Clique em "Entrar" no canto superior direito e depois em "Cadastre-se". Preencha seus dados e pronto! Você já pode fazer suas compras.'
    },
    {
      categoria: 'conta',
      pergunta: 'Esqueci minha senha, o que faço?',
      resposta: 'Na tela de login, clique em "Esqueci minha senha". Digite seu e-mail cadastrado e você receberá um link para redefinir sua senha.'
    },
    {
      categoria: 'conta',
      pergunta: 'Meus dados estão seguros?',
      resposta: 'Sim! Utilizamos criptografia SSL e seguimos as normas da LGPD. Seus dados são armazenados com segurança e nunca compartilhados com terceiros.'
    },
    {
      categoria: 'conta',
      pergunta: 'Como altero meus dados cadastrais?',
      resposta: 'Acesse "Meu Perfil" no menu superior, vá em "Dados Pessoais" e clique em "Editar". Atualize as informações desejadas e salve.'
    }
  ];

  const categorias = [
    { id: 'todas', nome: 'Todas' },
    { id: 'pedidos', nome: 'Pedidos e Pagamento' },
    { id: 'entrega', nome: 'Entrega' },
    { id: 'trocas', nome: 'Trocas e Devoluções' },
    { id: 'produtos', nome: 'Produtos' },
    { id: 'conta', nome: 'Conta e Segurança' }
  ];

  const faqsFiltrados = categoriaAtiva === 'todas' 
    ? faqs 
    : faqs.filter(faq => faq.categoria === categoriaAtiva);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'FAQ - Perguntas Frequentes' }]} />

        <div className={styles.hero}>
          <h1>Perguntas Frequentes</h1>
          <p>Encontre respostas para as dúvidas mais comuns</p>
        </div>

        {/* Filtros de Categoria */}
        <div className={styles.categorias}>
          {categorias.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoriaBtn} ${categoriaAtiva === cat.id ? styles.active : ''}`}
              onClick={() => setCategoriaAtiva(cat.id)}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Lista de FAQs */}
        <div className={styles.faqList}>
          {faqsFiltrados.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.pergunta}</span>
                {expandedIndex === index ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {expandedIndex === index && (
                <div className={styles.faqAnswer}>
                  <p>{faq.resposta}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contato */}
        <div className={styles.contato}>
          <h2>Não encontrou sua resposta?</h2>
          <p>Entre em contato conosco pelo WhatsApp ou e-mail</p>
          <div className={styles.contactButtons}>
            <a 
              href="https://wa.me/5511993385579" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.whatsappBtn}
            >
              WhatsApp: (11) 99338-5579
            </a>
            <a 
              href="mailto:contato@point55.com.br"
              className={styles.emailBtn}
            >
              E-mail: contato@point55.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
