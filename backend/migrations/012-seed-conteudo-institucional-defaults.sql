SET client_encoding = 'UTF8';

UPDATE conteudos_institucionais
SET
  resumo = 'Conheça nossa história, missão e compromissos com qualidade e atendimento.',
  conteudo_html = $$
<section>
  <h2>Quem Somos</h2>
  <p>A Point55 é uma marca focada em oferecer moda com qualidade, preço justo e experiência digital confiável.</p>
  <p>Nosso objetivo é simplificar sua compra: catálogo claro, pagamento seguro e entrega transparente.</p>
</section>
<section>
  <h2>Missão</h2>
  <p>Conectar estilo e praticidade, com atendimento humano e operação orientada à confiança do cliente.</p>
</section>
<section>
  <h2>Valores</h2>
  <ul>
    <li>Transparência nas informações</li>
    <li>Respeito ao cliente</li>
    <li>Compromisso com qualidade</li>
    <li>Melhoria contínua da plataforma</li>
  </ul>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'sobre' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Como coletamos, usamos e protegemos seus dados pessoais.',
  conteudo_html = $$
<section>
  <h2>1. Introdução</h2>
  <p>Esta política descreve como tratamos dados pessoais em conformidade com a legislação aplicável, incluindo a LGPD.</p>
</section>
<section>
  <h2>2. Dados Coletados</h2>
  <ul>
    <li>Dados cadastrais e de contato</li>
    <li>Dados de entrega e faturamento</li>
    <li>Dados técnicos de navegação</li>
  </ul>
</section>
<section>
  <h2>3. Finalidades</h2>
  <p>Utilizamos os dados para processar pedidos, prevenir fraudes, oferecer suporte e melhorar a experiência da loja.</p>
</section>
<section>
  <h2>4. Direitos do Titular</h2>
  <p>Você pode solicitar acesso, correção, exclusão e portabilidade dos dados, conforme previsão legal.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'politica' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Condições gerais de uso da plataforma e responsabilidades das partes.',
  conteudo_html = $$
<section>
  <h2>1. Aceite dos Termos</h2>
  <p>Ao acessar e utilizar a plataforma, você concorda com estes termos e com as políticas vinculadas.</p>
</section>
<section>
  <h2>2. Cadastro e Conta</h2>
  <p>O usuário deve manter informações verdadeiras e atualizadas, zelando pela segurança das credenciais.</p>
</section>
<section>
  <h2>3. Compras e Pagamentos</h2>
  <p>Preços, condições comerciais e meios de pagamento são exibidos no checkout e podem variar por campanha.</p>
</section>
<section>
  <h2>4. Alterações</h2>
  <p>Podemos atualizar estes termos periodicamente. A versão vigente será sempre a publicada nesta página.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'termos' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Regras e prazos para solicitações de troca e devolução.',
  conteudo_html = $$
<section>
  <h2>Direito de Arrependimento</h2>
  <p>Para compras online, o cliente pode desistir no prazo legal contado do recebimento do pedido, conforme legislação vigente.</p>
</section>
<section>
  <h2>Condições para Troca</h2>
  <ul>
    <li>Produto sem sinais de uso indevido</li>
    <li>Itens e acessórios preservados</li>
    <li>Solicitação dentro do prazo informado</li>
  </ul>
</section>
<section>
  <h2>Como Solicitar</h2>
  <p>A solicitação deve ser feita pela área de pedidos, com número do pedido e motivo da troca/devolução.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'trocas' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Perguntas frequentes sobre pedidos, entrega e suporte.',
  conteudo_html = $$
<section>
  <h2>Perguntas Frequentes</h2>
  <h3>Como acompanho meu pedido?</h3>
  <p>Acompanhe pelo menu de pedidos e pela página de rastreio quando houver código de envio.</p>
  <h3>Quais formas de pagamento são aceitas?</h3>
  <p>Os meios disponíveis aparecem no checkout conforme regras e integrações ativas.</p>
  <h3>Como entro em contato?</h3>
  <p>Use os canais oficiais de atendimento informados no rodapé e na área de suporte.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'faq' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Página de avaliação da experiência de compra.',
  conteudo_html = $$
<section>
  <h2>Conteúdo Gerenciado</h2>
  <p>Esta página está preparada para receber instruções e campanhas de satisfação definidas pelo time administrativo.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'satisfacao' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Referências de medidas e orientação para escolha de tamanho.',
  conteudo_html = $$
<section>
  <h2>Guia de Medidas</h2>
  <p>As tabelas e referências podem ser atualizadas pelo admin de acordo com a grade atual dos produtos.</p>
  <p>Em caso de dúvida, prefira a medida maior e consulte o suporte antes da compra.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'tabela-medidas' AND COALESCE(conteudo_html, '') = '';

UPDATE conteudos_institucionais
SET
  resumo = 'Informações sobre cálculo de frete, prazos e acompanhamento de envio.',
  conteudo_html = $$
<section>
  <h2>Política de Frete</h2>
  <p>O frete é calculado no checkout de acordo com CEP, itens do carrinho e regras comerciais vigentes.</p>
  <p>Os prazos estimados são apresentados no fechamento do pedido conforme a transportadora disponível.</p>
</section>
$$,
  atualizado_em = NOW()
WHERE slug = 'frete' AND COALESCE(conteudo_html, '') = '';
