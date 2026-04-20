# Entendimento - Admin > Configuracao de Frete

Objetivo
- Criar uma area no admin para configurar regras de embalagem e frete por tipo de produto (ex.: tenis, camiseta, perfume, bone).
- Para cada tipo, cadastrar 3 tipos de caixa (pequena, media, grande ou nomes equivalentes).
- Cada caixa sera vinculada a uma quantidade de itens para orientar o empacotamento e melhorar o calculo de frete.

Resumo da ideia (o que eu entendi)
- O admin escolhe um tipo de produto e define 3 linhas (P/M/G) com capacidade e caixa predefinida.
- As caixas P/M/G tem medidas padrao; o admin so escolhe qual usar e informa a capacidade.
- O sistema usa essas caixas para dividir a quantidade comprada em volumes de envio.
- Exemplo: se o cliente comprar 4 tenis e a caixa de 2 tenis estiver configurada, o sistema usa 2 caixas de 2 tenis.

Regras de embalagem (proposta inicial)
- Cada caixa tem capacidade em itens; medidas vem do catalogo P/M/G.
- O calculo tenta encaixar a quantidade comprada usando a combinacao de caixas do tipo.
- Prioridade sugerida: usar a maior capacidade valida que nao ultrapasse a quantidade restante.
- Quando houver sobra que nao encaixa exatamente, usar a menor caixa disponivel para completar.
- Se nao houver caixa configurada para o tipo, usar o fallback global P/M/G.
- O resultado final deve ser uma lista de volumes para o calculo de frete.

Dados a configurar por tipo de produto
- Nome do tipo (ex.: tenis, camiseta, perfume, bone).
- 3 linhas fixas: P, M, G.
- Para cada linha:
	- Caixa (selecionar do catalogo P/M/G padrao).
	- Capacidade (quantidade de itens).
	- Peso medio por item (para calcular peso do volume).
	- Observacoes internas (opcional).
- Catalogo global de caixas P/M/G (medidas padrao e peso da caixa).

Fluxo no admin (proposta)
- Tela "Configuracao de Frete" com lista de tipos.
- Selecionar tipo -> formulario com 3 linhas (P/M/G).
- Cada linha permite escolher caixa P/M/G e informar capacidade e peso medio por item.
- Validacao ao salvar: capacidade positiva, peso positivo, caixas com capacidades diferentes.
- Botao para duplicar configuracao de outro tipo (economiza tempo).

Uso no calculo de frete
- No checkout, o sistema agrupa itens por tipo de produto.
- Para cada tipo, aplica as regras de embalagem para gerar volumes.
- Soma todos os volumes e envia ao provedor de frete (correios/transportadora/outsourced).

Exemplos
- 4 tenis, caixas: 1, 2, 4 -> usar 1 caixa de 4.
- 4 tenis, caixas: 1, 2, 3 -> usar 1 caixa de 3 + 1 caixa de 1.
- 7 camisetas, caixas: 2, 4, 6 -> usar 1 caixa de 6 + 1 caixa de 2 (sobra 1, usar caixa menor).

Confirmacoes (respostas)
- Tipos de produto vem dos produtos existentes; se nao houver, criar campo "tipo" ou usar categoria e exigir no cadastro/edicao.
- Capacidade e peso medio por item sao obrigatorios em todas as linhas.
- Medidas das caixas vem do catalogo P/M/G padrao.
- Quantidades sao faixas medias (nao valores exatos).
- Pode existir mistura de tipos na mesma caixa (modelos mistos).
- Regra sem configuracao: usar fallback global P/M/G.
- Apenas admin pode editar; nao precisa de auditoria/registro.
- Uso apenas no checkout para calculo de frete; cliente nao ve configuracao.
- Peso medio considera caixa + itens.

Configuracao Fallback Global
- Sera configuravel em uma tela unica no admin.
- Admin define 3 linhas (P/M/G) com caixa padrao e capacidade para cada categoria.
- Essa configuracao serve como base para tipos de produto sem regras especificas.
- Campos por linha: caixa (do catalogo), capacidade media, peso medio por item.
- Validacao: capacidade positiva, peso positivo.

Proximos passos sugeridos
- Definir modelo de dados (campos, tabelas, endpoints).
- Desenhar a tela no admin (fluxo e validacoes).
- Implementar o algoritmo de embalagem e integrar ao calculo de frete.
