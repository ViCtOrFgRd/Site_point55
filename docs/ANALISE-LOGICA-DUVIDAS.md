# Analise logica - duvidas e pontos para confirmar

Data: 08/02/2026

## Resumo rapido
Este documento lista os pontos de logica que podem impactar o funcionamento do site e as duvidas para confirmar o comportamento esperado. Responda as perguntas para eu sugerir as correcoes certas.

---

## 1) Promocoes e preco final (carrinho e pedido)
**Observacao:** O carrinho e o pedido usam o preco base do produto. As promocoes vigentes sao aplicadas somente na listagem de produtos e na pagina do produto, entao o cliente pode ver desconto e ser cobrado sem desconto no checkout.

**Duvidas:**
1. As promocoes devem valer no carrinho e no checkout, sempre que estiverem vigentes?
1.1 Sim, deverão
2. Voce quer calcular o preco promocional de forma dinamica (com base na tabela de promocoes) ou deseja persistir o preco promocional no produto?
1.2 Sim, o preco promocional deve ser calculado dinamicamente com base na tabela de promocoes. Isso garante que as promocoes sejam aplicadas corretamente mesmo que o preco base do produto seja atualizado posteriormente.
3. Quando houver desconto fixo, o preco pode ficar abaixo de R$ 0,01 ou deve ser travado em um minimo?
O preco deve ser travado em um minimo de R$ 0,01 para evitar que o produto seja vendido a um valor negativo ou zero, o que poderia causar problemas no processo de pagamento e na contabilidade da loja.

---

## 2) Carrinho com variantes (tamanho e cor)
**Observacao:** A remocao e a atualizacao de quantidade no frontend usam apenas o ID do produto. Se o usuario adicionar o mesmo produto com tamanhos/cores diferentes, remover ou alterar pode afetar todas as variantes.

**Duvidas:**
1. O carrinho deve permitir varias variantes do mesmo produto (tamanho e cor diferentes) ao mesmo tempo?
2.1 Sim, o carrinho deve permitir que o usuario adicione varias variantes do mesmo produto, como diferentes tamanhos e cores, ao mesmo tempo. Cada variante deve ser tratada como um item separado no carrinho para evitar confusao e garantir que as promocoes sejam aplicadas corretamente a cada variante.
2. Quando remover/alterar, deve agir apenas na variante selecionada ou em todas as variantes do produto?
2.2 Ao remover ou alterar a quantidade de um item no carrinho, a acao deve afetar apenas a variante selecionada. Isso significa que se o usuario tiver adicionado o mesmo produto em diferentes tamanhos ou cores, a remocao ou alteracao de um item nao deve impactar os outros itens do mesmo produto que estao no carrinho. Cada variante deve ser tratada de forma independente para garantir uma experiencia de compra mais precisa e personalizada.

---

## 3) Categorias e multiplas categorias
**Observacao:** O backend usa a coluna produtos.categoria_id na contagem e na listagem por categoria, mas o cadastro ja suporta multiplas categorias via tabela produto_categorias. Isso causa contagem incorreta e produtos faltando na listagem.

**Duvidas:**
1. As categorias devem ser 100% baseadas em produto_categorias?
3.1 Sim, ser o produto pode pertencer a multiplas categorias, a logica de categorias deve ser 100% baseada na tabela produto_categorias. Isso garante que a contagem e a listagem por categoria sejam precisas e reflitam corretamente os produtos associados a cada categoria, mesmo quando um produto pertence a varias categorias.
2. Ainda existe algum uso obrigatorio de produtos.categoria_id ou pode ser tratado como compatibilidade antiga?
3.2 A coluna produtos.categoria_id pode ser tratada como compatibilidade antiga e nao deve ser usada para a logica de categorias. Toda a logica de categorias deve ser migrada para usar exclusivamente a tabela produto_categorias, garantindo assim uma estrutura mais flexivel e precisa para associar produtos a multiplas categorias sem depender de uma unica categoria fixa.

---

## 4) Ordenacao em /categorias/:id/produtos
**Observacao:** O parametro "ordem" vai direto para o SQL (ORDER BY) e permite entrada livre. Isso abre risco de injecao.

**Duvidas:**
1. Quais ordenacoes voce quer permitir nesse endpoint? Ex: data_criacao, preco, nome, vendas.
2. A direcao deve ser fixa (ASC/DESC) ou configuravel por querystring?
4.1 As ordenacoes permitidas para o endpoint /categorias/:id/produtos devem incluir: data_criacao, preco, nome e vendas. Essas opcoes permitem que os usuarios classifiquem os produtos de acordo com criterios relevantes, como a data em que foram adicionados, o preco, o nome do produto ou a popularidade com base nas vendas.
4.2 A direcao de ordenacao deve ser configuravel por querystring, permitindo que os usuarios escolham entre ASC (ascendente) ou DESC (descendente) para cada criterio de ordenacao. Isso oferece flexibilidade adicional para os usuarios personalizarem a exibicao dos produtos de acordo com suas preferencias.
---

## 5) Filtro "somente em promocao"
**Observacao:** O filtro atual usa apenas produtos com desconto_percentual > 0, ignorando promocoes vigentes da tabela de promocoes.

**Duvidas:**
1. O filtro deve considerar promocoes da tabela promocoes alem do desconto_percentual?
5.1 Sim, o filtro "somente em promocao" deve considerar as promocoes vigentes da tabela de promocoes, alem do desconto_percentual. Isso garante que os usuarios possam ver todos os produtos que estao atualmente em promocao, mesmo que o desconto percentual nao seja maior que zero, mas haja uma promocao ativa aplicavel ao produto.
2. Deve priorizar a melhor promocao quando houver varias?
5.2 Sim, quando houver varias promocoes aplicaveis a um produto, o sistema deve priorizar a melhor promocao, ou seja, aquela que oferece o maior desconto para o cliente. Isso garante que os usuarios vejam o preco mais vantajoso para os produtos em promocao, aumentando a atratividade das ofertas e incentivando as compras.

---

## 6) Listagem de promocoes
**Observacao:** A rota /produtos/promocoes retorna produtos em promocao mas nao recalcula preco com a promocao vigente, entao o preco pode vir "sem desconto".

**Duvidas:**
1. Essa rota deve retornar sempre o preco final ja calculado?
6.1 Sim, a rota /produtos/promocoes deve retornar sempre o preco final ja calculado com a promocao vigente. Isso garante que os usuarios vejam o preco correto dos produtos em promocao, refletindo os descontos aplicaveis e evitando confusao sobre o valor real dos produtos listados como promocao.
2. Exibir preco_original e desconto_percentual calculado nesta rota?
6.2 Sim, exibir o preco_original e o desconto_percentual calculado nesta rota pode ser uma boa pratica para fornecer transparencia aos usuarios sobre o valor do desconto aplicado. Isso permite que os usuarios vejam claramente o preco original do produto e o percentual de desconto, ajudando-os a entender melhor a promocao e a tomar decisoes de compra mais informadas.

---

## 7) Promocoes aplicaveis a produto
**Observacao:** A verificacao de promocoes aplicaveis nao considera produtos_aplicaveis = NULL como promocao global.

**Duvidas:**
1. Promocoes globais sao representadas por NULL, array vazio, ou ambos?
7.1 Promocoes globais devem ser representadas por NULL na coluna produtos_aplicaveis. Isso indica que a promocao se aplica a todos os produtos sem restricao. O uso de um array vazio poderia ser interpretado como uma promocao que nao se aplica a nenhum produto, o que nao seria o caso para uma promocao global. Portanto, NULL e a forma mais clara e apropriada para indicar que uma promocao e global e se aplica a todos os produtos.
2. Se for ambos, devo considerar as duas formas?
7.2 Se for decidido que tanto NULL quanto um array vazio podem ser usados para representar promocoes globais, o sistema deve ser configurado para considerar ambas as formas como indicativo de uma promocao global. Isso significa que, ao verificar se uma promocao se aplica a um produto, o sistema deve tratar tanto NULL quanto um array vazio como sinal de que a promocao e aplicavel a todos os produtos, garantindo assim que as promocoes globais sejam corretamente identificadas e aplicadas independentemente da forma como foram representadas na base de dados.

---

## 8) Logica de pagina de produto (client)
**Observacao:** O uso de use(params) em pagina client pode gerar erro dependendo da versao do Next e do runtime.

**Duvidas:**
1. Qual a versao do Next usada no frontend?
8.1 A versao do Next usada no frontend e a 13.4.0. Essa versao introduziu melhorias significativas na renderizacao e no desempenho, mas tambem pode ter algumas peculiaridades em relacao ao uso de hooks como use(params). E importante garantir que o uso desses hooks esteja alinhado com as melhores praticas recomendadas para essa versao do Next para evitar erros e garantir uma experiencia de usuario suave.
2. Se preferir, posso trocar para usar o parametro diretamente (sem use) e ajustar o typing?
8.2 Sim, 

---

## 9) Preco zero e desconto fixo
**Observacao:** Ao calcular desconto fixo, o percentual e calculado por preco. Se preco for 0, o calculo vira infinito.

**Duvidas:**
1. Produtos com preco 0 devem aparecer no site?
9.1 Não, produtos com preco 0 não devem aparecer no site. Isso pode causar confusão para os clientes e problemas no processo de pagamento, além de não ser uma prática comum em lojas online. Se um produto tem um preço de custo ou é oferecido gratuitamente, é melhor indicar isso claramente na descrição do produto ou usar uma estratégia diferente para promover o produto sem listá-lo com um preço de 0.
2. Posso bloquear promocao fixa quando preco <= 0?
9.2 Sim, bloquear a aplicação de promoções fixas quando o preço do produto for menor ou igual a 0 é uma medida sensata para evitar problemas de cálculo e garantir que os preços dos produtos sejam sempre positivos. Isso ajuda a manter a integridade do sistema de preços e evita situações em que um produto possa ser vendido a um preço negativo ou zero, o que poderia causar confusão para os clientes e complicações no processo de pagamento.

---

## 10) Fluxo de cupom no checkout
**Observacao:** No frontend o cupom valida no subtotal; no backend o desconto e calculado no subtotal sem promocoes. Se o preco promocional for aplicado no futuro, o subtotal muda.

**Duvidas:**
1. O cupom deve ser calculado sobre o subtotal com promocao aplicada ou sobre o preco base?
10.1 O cupom deve ser calculado sobre o subtotal com a promoção aplicada. Isso garante que os clientes recebam o desconto do cupom com base no valor final que estão pagando, incluindo quaisquer descontos promocionais já aplicados. Calcular o cupom sobre o preço base poderia resultar em um desconto maior do que o esperado para os clientes, especialmente se houver promoções significativas, e isso pode levar a confusão e insatisfação. Portanto, é mais justo e transparente calcular o cupom com base no subtotal após a aplicação das promoções.
2. Se houver cupom percentual e promocao, o cupom aplica sobre o preco ja promocional?
Não, se houver um cupom percentual e uma promoção aplicável, o cupom deve ser aplicado sobre o preço já promocional. Isso significa que o desconto do cupom será calculado com base no valor final do produto após a aplicação da promoção, garantindo que os clientes recebam um desconto justo e consistente. Aplicar o cupom sobre o preço base, sem considerar a promoção, poderia resultar em um desconto maior do que o esperado para os clientes, especialmente se a promoção já tiver reduzido significativamente o preço do produto. Portanto, é mais adequado aplicar o cupom sobre o preço promocional para manter a transparência e a satisfação do cliente.

---

## 11) Revisao geral - pendencias encontradas
**Observacao:** Alguns pontos encontrados na revisao geral podem gerar bug ou comportamento inesperado.

**Duvidas:**
1. Em backend/routes/promocoes.js, devo reordenar as rotas para que /promocoes/produtos/:id nao seja capturada por /promocoes/:id?
1.1 Sim, é importante reordenar as rotas para garantir que a rota mais específica (/promocoes/produtos/:id) seja definida antes da rota mais genérica (/promocoes/:id). Isso evita que a rota genérica capture as requisições destinadas à rota específica, garantindo que as requisições sejam roteadas corretamente e evitando erros de roteamento no backend.
2. Em frontend/src/app/pedidos/[id]/page.tsx, devo alinhar os campos com o backend (subtotal/desconto/frete/total + endereco plano + imagens) e trocar use(params) por useParams?
2.1 Sim, é importante alinhar os campos exibidos na página de detalhes do pedido com os campos retornados pelo backend para garantir consistência e clareza para os usuários. Isso inclui exibir o subtotal, desconto, frete, total, além de informações de endereço e imagens dos produtos. Além disso, trocar o uso de use(params) por useParams é recomendado para garantir compatibilidade com a versão do Next.js utilizada e evitar possíveis erros relacionados ao acesso aos parâmetros da rota.
3. Em frontend/src/app/perfil/page.tsx, devo usar response.data.token apos cadastro para auto-login?
3.1 Sim, usar response.data.token após o cadastro para realizar um auto-login é uma prática comum e recomendada para melhorar a experiência do usuário. Isso permite que os usuários sejam automaticamente autenticados e redirecionados para a página de perfil ou dashboard após se registrarem, sem a necessidade de fazer login manualmente. Certifique-se de armazenar o token de forma segura (por exemplo, em cookies HttpOnly) para proteger as informações do usuário e garantir uma experiência de login suave e segura.
4. Em backend/controllers/produtoController.js (listarDestaques), devo usar produto_categorias e filtrar preco > 0?
4.1 Sim, é recomendável usar a tabela produto_categorias para listar os produtos em destaque, pois isso permite uma associação mais flexível entre produtos e categorias. Além disso, filtrar por preço > 0 é importante para garantir que apenas produtos com um preço válido sejam exibidos como destaques, evitando confusão para os clientes e garantindo que os produtos listados sejam realmente disponíveis para compra.

---

## Responda no formato
- 1.1: ...
- 1.2: ...
- 1.3: ...
- 2.1: ...
- 2.2: ...
- etc.
