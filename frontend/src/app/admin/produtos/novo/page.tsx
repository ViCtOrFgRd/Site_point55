/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import { productService, categoryService, tipoProdutoService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import ColorInputWithSuggestions from '@/components/ColorInputWithSuggestions/ColorInputWithSuggestions';
import styles from '../[id]/produto-form.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function NovoProdutoPage() {
  const { user, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiposProduto, setTiposProduto] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    preco_pix: 0,
    preco_debito: 0,
    preco_credito: 0,
    preco_boleto: 0,
    preco_original: 0,
    parcelas_maximas: 3,
    desconto_percentual: 0,
    categoria_id: '',
    categoria_ids: [] as string[],
    estoque: 0,
    imagens: [] as string[],
    cores_disponiveis: [] as string[],
    tamanhos_disponiveis: [] as string[],
    estoque_variantes: {} as Record<string, number>,
    estoque_cores: {} as Record<string, number>,
    estoque_tamanhos: {} as Record<string, number>,
    tipo_produto_id: null as number | null,
    ativo: true,
  });

  const [usarMesmoValorPagamentos, setUsarMesmoValorPagamentos] = useState(true);

  const [imagemInput, setImagemInput] = useState('');
  const [imagemTipo, setImagemTipo] = useState<'url' | 'upload'>('url');
  const [tamanhoInput, setTamanhoInput] = useState('');
  const [percentualCorPredominante, setPercentualCorPredominante] = useState(68);
  const estoqueCalculadoPorVariacoes = formData.tamanhos_disponiveis.length > 0 || formData.cores_disponiveis.length > 0;

  const normalizeSize = (size: string) => size.trim().toUpperCase();
  const normalizeColor = (color: string) => color.replace(/@\s*\d{1,3}\s*%?$/i, '').trim().toUpperCase();
  const normalizeVariantKey = (size: string, color: string) => `${normalizeSize(size)}|${normalizeColor(color)}`;

  const mapKeysByNormalizedValue = (items: string[], normalizer: (value: string) => string) =>
    items.reduce((acc, item) => {
      const key = normalizer(item);
      if (key) acc[key] = item.trim();
      return acc;
    }, {} as Record<string, string>);

  const somaEstoquePorTamanho = (mapa: Record<string, number>) =>
    Object.values(mapa || {}).reduce((acc, qty) => acc + Number(qty || 0), 0);

  const somaEstoquePorCor = (mapa: Record<string, number>) =>
    Object.values(mapa || {}).reduce((acc, qty) => acc + Number(qty || 0), 0);

  const somaEstoquePorVariacao = (mapa: Record<string, number>) =>
    Object.values(mapa || {}).reduce((acc, qty) => acc + Number(qty || 0), 0);

  const parseNumberOrFallback = (value: string, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseIntOrFallback = (value: string, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const displayZeroAsEmpty = (value: number) => (value === 0 ? '' : value);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarCategorias();
      carregarTiposProduto();
    }
  }, [user]);

  const carregarCategorias = async () => {
    try {
      const response = await categoryService.getAllAdmin();
      if (response.success) {
        setCategorias(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarTiposProduto = async () => {
    try {
      const response = await tipoProdutoService.getAll();
      if (response.success) {
        setTiposProduto(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de produto:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.preco || formData.categoria_ids.length === 0) {
      showError('Preencha os campos obrigatórios: Nome, Preço e Categoria');
      return;
    }

    setLoading(true);
    try {
      const categoriaIds = formData.categoria_ids.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id));
      const tamanhosNormalizados = formData.tamanhos_disponiveis.map(normalizeSize).filter(Boolean);
      const coresNormalizadas = formData.cores_disponiveis.map(normalizeColor).filter(Boolean);

      const estoqueTamanhosSanitizado = Object.entries(formData.estoque_tamanhos || {}).reduce((acc, [size, qty]) => {
        const sizeKey = normalizeSize(size);
        const qtyValue = Number.isFinite(Number(qty)) ? Math.max(0, Number(qty)) : 0;
        if (sizeKey) acc[sizeKey] = qtyValue;
        return acc;
      }, {} as Record<string, number>);

      const totalEstoqueTamanhos = somaEstoquePorTamanho(estoqueTamanhosSanitizado);
      const controlaPorTamanho = Object.keys(estoqueTamanhosSanitizado).length > 0;
      const estoqueCoresSanitizado = Object.entries(formData.estoque_cores || {}).reduce((acc, [color, qty]) => {
        const colorKey = normalizeColor(color);
        const qtyValue = Number.isFinite(Number(qty)) ? Math.max(0, Number(qty)) : 0;
        if (colorKey) acc[colorKey] = qtyValue;
        return acc;
      }, {} as Record<string, number>);
      const estoqueVariantesSanitizado = Object.entries(formData.estoque_variantes || {}).reduce((acc, [variant, qty]) => {
        const [sizeRaw = '', colorRaw = ''] = String(variant).split('|');
        const sizeKey = normalizeSize(sizeRaw);
        const colorKey = normalizeColor(colorRaw);
        const qtyValue = Number.isFinite(Number(qty)) ? Math.max(0, Number(qty)) : 0;

        if (!sizeKey || !colorKey) return acc;
        if (tamanhosNormalizados.length > 0 && !tamanhosNormalizados.includes(sizeKey)) return acc;
        if (coresNormalizadas.length > 0 && !coresNormalizadas.includes(colorKey)) return acc;

        acc[normalizeVariantKey(sizeKey, colorKey)] = qtyValue;
        return acc;
      }, {} as Record<string, number>);

      const totalEstoqueCores = somaEstoquePorCor(estoqueCoresSanitizado);
      const totalEstoqueVariacoes = somaEstoquePorVariacao(estoqueVariantesSanitizado);
      const controlaPorVariacao = Object.keys(estoqueVariantesSanitizado).length > 0;
      const controlaPorCor = !controlaPorVariacao && !controlaPorTamanho && Object.keys(estoqueCoresSanitizado).length > 0;

      const data = {
        ...formData,
        categoria_id: categoriaIds[0] || parseInt(formData.categoria_id, 10),
        categoria_ids: categoriaIds,
        preco: parseFloat(formData.preco.toString()),
        preco_pix: formData.preco_pix > 0 ? parseFloat(formData.preco_pix.toString()) : parseFloat(formData.preco.toString()),
        preco_debito: formData.preco_debito > 0 ? parseFloat(formData.preco_debito.toString()) : parseFloat(formData.preco.toString()),
        preco_credito: formData.preco_credito > 0 ? parseFloat(formData.preco_credito.toString()) : parseFloat(formData.preco.toString()),
        preco_boleto: formData.preco_boleto > 0 ? parseFloat(formData.preco_boleto.toString()) : parseFloat(formData.preco.toString()),
        preco_original: parseFloat(formData.preco_original.toString()) || null,
        parcelas_maximas: parseInt(formData.parcelas_maximas.toString(), 10) || 3,
        desconto_percentual: parseFloat(formData.desconto_percentual.toString()) || 0,
        estoque: controlaPorVariacao
          ? totalEstoqueVariacoes
          : controlaPorTamanho
          ? totalEstoqueTamanhos
          : controlaPorCor
            ? totalEstoqueCores
            : parseInt(formData.estoque.toString()),
        estoque_variantes: estoqueVariantesSanitizado,
        estoque_tamanhos: estoqueTamanhosSanitizado,
        estoque_cores: estoqueCoresSanitizado,
      };

      const response = await productService.create(data);
      if (response.success) {
        success('Produto criado com sucesso!');
        router.push('/admin/produtos');
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const adicionarImagem = () => {
    if (imagemInput.trim()) {
      setFormData({
        ...formData,
        imagens: [...formData.imagens, imagemInput.trim()],
      });
      setImagemInput('');
    }
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de arquivo não suportado. Use apenas imagens (JPEG, PNG, GIF, WEBP).');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('imagem', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/produtos/upload-imagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Adicionar a URL da imagem ao array de imagens
        const imageUrl = data.data.url.startsWith('http') 
          ? data.data.url 
          : `${API_URL.replace('/api', '')}${data.data.url}`;
        
        setFormData(prev => ({
          ...prev,
          imagens: [...prev.imagens, imageUrl],
        }));
        success('Imagem enviada com sucesso!');
      } else {
        showError(data.message || 'Erro ao fazer upload da imagem');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      showError('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
      // Limpar o input file
      e.target.value = '';
    }
  };

  const removerImagem = (index: number) => {
    setFormData({
      ...formData,
      imagens: formData.imagens.filter((_, i) => i !== index),
    });
  };

  const adicionarCor = (rawColor: string) => {
    const baseColorLabel = rawColor.trim().toLowerCase().replace(/\\/g, '/');
    const colorLabel = /[\\/]/.test(baseColorLabel)
      ? `${baseColorLabel.replace(/@\s*\d{1,3}\s*%?$/i, '').trim()}@${percentualCorPredominante}`
      : baseColorLabel;
    const normalized = normalizeColor(colorLabel);
    const normalizedExisting = new Set(formData.cores_disponiveis.map(normalizeColor));

    if (normalized && !normalizedExisting.has(normalized)) {
      setFormData({
        ...formData,
        cores_disponiveis: [...formData.cores_disponiveis, colorLabel],
        estoque_cores: {
          ...formData.estoque_cores,
          [normalized]: Number(formData.estoque_cores[normalized] || 0),
        },
      });
    }
  };

  const removerCor = (index: number) => {
    const cor = formData.cores_disponiveis[index] || '';
    const corKey = normalizeColor(cor);
    const nextStockByColor = { ...formData.estoque_cores };
    delete nextStockByColor[corKey];
    const nextVariantStock = Object.entries(formData.estoque_variantes || {}).reduce((acc, [variant, qty]) => {
      const [sizeRaw = '', colorRaw = ''] = String(variant).split('|');
      if (normalizeColor(colorRaw) !== corKey) {
        acc[variant] = qty;
      }
      return acc;
    }, {} as Record<string, number>);

    setFormData({
      ...formData,
      cores_disponiveis: formData.cores_disponiveis.filter((_, i) => i !== index),
      estoque_variantes: nextVariantStock,
      estoque_cores: nextStockByColor,
    });
  };

  const adicionarTamanho = () => {
    const size = normalizeSize(tamanhoInput);
    if (size && !formData.tamanhos_disponiveis.map(normalizeSize).includes(size)) {
      setFormData({
        ...formData,
        tamanhos_disponiveis: [...formData.tamanhos_disponiveis, size],
        estoque_tamanhos: {
          ...formData.estoque_tamanhos,
          [size]: Number(formData.estoque_tamanhos[size] || 0),
        },
      });
      setTamanhoInput('');
    }
  };

  const removerTamanho = (index: number) => {
    const size = normalizeSize(formData.tamanhos_disponiveis[index] || '');
    const nextStockBySize = { ...formData.estoque_tamanhos };
    delete nextStockBySize[size];
    const nextVariantStock = Object.entries(formData.estoque_variantes || {}).reduce((acc, [variant, qty]) => {
      const [sizeRaw = '', colorRaw = ''] = String(variant).split('|');
      if (normalizeSize(sizeRaw) !== size) {
        acc[variant] = qty;
      }
      return acc;
    }, {} as Record<string, number>);

    setFormData({
      ...formData,
      tamanhos_disponiveis: formData.tamanhos_disponiveis.filter((_, i) => i !== index),
      estoque_variantes: nextVariantStock,
      estoque_tamanhos: nextStockBySize,
    });
  };

  const atualizarEstoquePorVariacao = (size: string, color: string, value: string) => {
    const variantKey = normalizeVariantKey(size, color);
    const quantidade = Number.parseInt(value, 10);

    setFormData((prev) => ({
      ...prev,
      estoque_variantes: {
        ...prev.estoque_variantes,
        [variantKey]: Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0,
      },
    }));
  };

  const atualizarEstoquePorTamanho = (size: string, value: string) => {
    const normalized = normalizeSize(size);
    const quantidade = Number.parseInt(value, 10);

    setFormData((prev) => ({
      ...prev,
      estoque_tamanhos: {
        ...prev.estoque_tamanhos,
        [normalized]: Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0,
      },
    }));
  };

  const atualizarEstoquePorCor = (color: string, value: string) => {
    const normalized = normalizeColor(color);
    const quantidade = Number.parseInt(value, 10);

    setFormData((prev) => ({
      ...prev,
      estoque_cores: {
        ...prev.estoque_cores,
        [normalized]: Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0,
      },
    }));
  };

  const handleCreditoChange = (valor: number) => {
    if (usarMesmoValorPagamentos) {
      setFormData(prev => ({
        ...prev,
        preco_credito: valor,
        preco_debito: valor,
        preco_boleto: valor,
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      preco_credito: valor,
    }));
  };

  const handleToggleMesmoValor = (checked: boolean) => {
    setUsarMesmoValorPagamentos(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        preco_debito: prev.preco_credito || prev.preco,
        preco_boleto: prev.preco_credito || prev.preco,
      }));
    }
  };

  // Calcular desconto automaticamente
  useEffect(() => {
    if (formData.preco_original > 0 && formData.preco > 0) {
      const desconto = ((formData.preco_original - formData.preco) / formData.preco_original) * 100;
      setFormData(prev => ({ ...prev, desconto_percentual: Math.round(desconto * 100) / 100 }));
    }
  }, [formData.preco, formData.preco_original]);

  useEffect(() => {
    const normalizedSizes = formData.tamanhos_disponiveis.map(normalizeSize).filter(Boolean);
    const normalizedColorsMap = mapKeysByNormalizedValue(formData.cores_disponiveis, normalizeColor);
    const normalizedColors = Object.keys(normalizedColorsMap);

    const estoqueMapTamanhosFiltrado = normalizedSizes.reduce((acc, size) => {
      acc[size] = Number(formData.estoque_tamanhos[size] || 0);
      return acc;
    }, {} as Record<string, number>);

    const estoqueMapCoresFiltrado = normalizedColors.reduce((acc, colorKey) => {
      acc[colorKey] = Number(formData.estoque_cores[colorKey] || 0);
      return acc;
    }, {} as Record<string, number>);

    const estoqueMapVariacoesFiltrado = normalizedSizes.reduce((acc, sizeKey) => {
      normalizedColors.forEach((colorKey) => {
        const variantKey = normalizeVariantKey(sizeKey, colorKey);
        acc[variantKey] = Number(formData.estoque_variantes[variantKey] || 0);
      });
      return acc;
    }, {} as Record<string, number>);

    const totalPorTamanho = somaEstoquePorTamanho(estoqueMapTamanhosFiltrado);
    const totalPorCor = somaEstoquePorCor(estoqueMapCoresFiltrado);
    const totalPorVariacao = somaEstoquePorVariacao(estoqueMapVariacoesFiltrado);
    const totalCalculado = normalizedSizes.length > 0 && normalizedColors.length > 0
      ? totalPorVariacao
      : normalizedSizes.length > 0
        ? totalPorTamanho
        : normalizedColors.length > 0
          ? totalPorCor
          : formData.estoque;

    const tamanhoMudou = JSON.stringify(estoqueMapTamanhosFiltrado) !== JSON.stringify(formData.estoque_tamanhos);
    const corMudou = JSON.stringify(estoqueMapCoresFiltrado) !== JSON.stringify(formData.estoque_cores);
    const variacaoMudou = JSON.stringify(estoqueMapVariacoesFiltrado) !== JSON.stringify(formData.estoque_variantes);

    if (totalCalculado !== formData.estoque || tamanhoMudou || corMudou || variacaoMudou) {
      setFormData((prev) => ({
        ...prev,
        estoque: totalCalculado,
        estoque_tamanhos: estoqueMapTamanhosFiltrado,
        estoque_cores: estoqueMapCoresFiltrado,
        estoque_variantes: estoqueMapVariacoesFiltrado,
      }));
    }
  }, [formData.tamanhos_disponiveis, formData.estoque_tamanhos, formData.cores_disponiveis, formData.estoque_cores, formData.estoque_variantes]);

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.produtoForm}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/admin/produtos" className={styles.backButton}>
            <FiArrowLeft /> Voltar para Produtos
          </Link>
          <h1>Novo Produto</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formCard}>
            <h2>Informações Básicas</h2>
            
            <div className={styles.formGroup}>
              <label>Nome do Produto *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                placeholder="Ex: Camiseta Básica"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o produto..."
                rows={5}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Categorias *</label>
              <select
                multiple
                name="categoria_ids"
                value={formData.categoria_ids}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                  setFormData({
                    ...formData,
                    categoria_ids: selected,
                    categoria_id: selected[0] || '',
                  });
                }}
                required
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
              <small>Segure Ctrl (Windows) para selecionar mais de uma.</small>
            </div>

            <div className={styles.formGroup}>
              <label>Tipo de Produto (Configuração de Frete)</label>
              <select
                value={formData.tipo_produto_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  tipo_produto_id: e.target.value ? parseIntOrFallback(e.target.value, 0) : null
                })}
              >
                <option value="">Usar configuração padrão (Fallback)</option>
                {tiposProduto.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome} ({tipo.codigo})
                  </option>
                ))}
              </select>
              <small>Define como o produto será empacotado para cálculo de frete</small>
            </div>
          </div>

          <div className={styles.formCard}>
            <h2>Preços e Promoção</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Preço Atual (R$) *</label>
                <input
                  type="number"
                  name="preco"
                  step="0.01"
                  min="0"
                  value={displayZeroAsEmpty(formData.preco)}
                  onChange={(e) => setFormData({ ...formData, preco: parseNumberOrFallback(e.target.value) })}
                  required
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço Original (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_original || ''}
                  onChange={(e) => setFormData({ ...formData, preco_original: parseNumberOrFallback(e.target.value) })}
                  placeholder="0.00"
                />
                <small>Deixe em branco se não houver promoção</small>
              </div>

              <div className={styles.formGroup}>
                <label>Desconto (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.desconto_percentual}
                  readOnly
                  disabled
                />
                <small>Calculado automaticamente</small>
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={usarMesmoValorPagamentos}
                  onChange={(e) => handleToggleMesmoValor(e.target.checked)}
                  id="mesmo-valor-pagamentos"
                />
                <label htmlFor="mesmo-valor-pagamentos">
                  Usa o mesmo valor no credito, debito e boleto
                </label>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Quantidade de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={formData.parcelas_maximas}
                  onChange={(e) => setFormData({ ...formData, parcelas_maximas: parseIntOrFallback(e.target.value, 1) })}
                  placeholder="3"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no PIX (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={displayZeroAsEmpty(formData.preco_pix)}
                  onChange={(e) => setFormData({ ...formData, preco_pix: parseNumberOrFallback(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no Credito (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={displayZeroAsEmpty(formData.preco_credito)}
                  onChange={(e) => handleCreditoChange(parseNumberOrFallback(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no Debito (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={displayZeroAsEmpty(formData.preco_debito)}
                  onChange={(e) => setFormData({ ...formData, preco_debito: parseNumberOrFallback(e.target.value) })}
                  placeholder="0.00"
                  disabled={usarMesmoValorPagamentos}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no Boleto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={displayZeroAsEmpty(formData.preco_boleto)}
                  onChange={(e) => setFormData({ ...formData, preco_boleto: parseNumberOrFallback(e.target.value) })}
                  placeholder="0.00"
                  disabled={usarMesmoValorPagamentos}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Estoque *</label>
              <input
                type="number"
                min="0"
                value={displayZeroAsEmpty(formData.estoque)}
                onChange={(e) => setFormData({ ...formData, estoque: parseIntOrFallback(e.target.value) })}
                required
                placeholder="0"
                disabled={estoqueCalculadoPorVariacoes}
                readOnly={estoqueCalculadoPorVariacoes}
              />
              {estoqueCalculadoPorVariacoes && (
                <small>
                  Estoque total calculado automaticamente por {formData.tamanhos_disponiveis.length > 0 && formData.cores_disponiveis.length > 0 ? 'variações (tamanho + cor)' : formData.tamanhos_disponiveis.length > 0 ? 'tamanhos' : 'cores'}.
                </small>
              )}
            </div>
          </div>

          <div className={styles.formCard}>
            <h2>Imagens</h2>
            
            <div className={styles.formGroup}>
              <label>Tipo de Imagem</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    value="url"
                    checked={imagemTipo === 'url'}
                    onChange={(e) => setImagemTipo('url')}
                  />
                  URL da Imagem
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    value="upload"
                    checked={imagemTipo === 'upload'}
                    onChange={(e) => setImagemTipo('upload')}
                  />
                  Upload de Arquivo
                </label>
              </div>
            </div>

            {imagemTipo === 'url' ? (
              <div className={styles.inputGroup}>
                <input
                  type="url"
                  value={imagemInput}
                  onChange={(e) => setImagemInput(e.target.value)}
                  placeholder="URL da imagem"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarImagem())}
                />
                <button type="button" onClick={adicionarImagem} className={styles.btnAdd}>
                  Adicionar
                </button>
              </div>
            ) : (
              <div className={styles.uploadGroup}>
                <label htmlFor="upload-imagem" className={styles.uploadLabel}>
                  {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                </label>
                <input
                  id="upload-imagem"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleUploadImagem}
                  disabled={uploading}
                  className={styles.uploadInput}
                />
                <small>Formatos aceitos: JPEG, PNG, GIF, WEBP (máx. 5MB)</small>
              </div>
            )}

            <div className={styles.tagsList}>
              {formData.imagens.map((img, index) => (
                <div key={index} className={styles.imagePreview}>
                  <img src={img} alt={`Imagem ${index + 1}`} />
                  <button type="button" onClick={() => removerImagem(index)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formCard}>
            <h2>Variações</h2>
            
            <div className={styles.formGroup}>
              <ColorInputWithSuggestions
                label="Cores Disponíveis"
                existingColors={formData.cores_disponiveis}
                onAddColor={adicionarCor}
              />

              <div className={styles.formGroup}>
                <label>porcentagem da primeira cor (para combinações com /)</label>
                <select
                  value={percentualCorPredominante}
                  onChange={(e) => setPercentualCorPredominante(parseInt(e.target.value, 10) || 68)}
                >
                  {[50, 55, 60, 65, 68, 70, 75, 80, 85, 90].map((percentual) => (
                    <option key={percentual} value={percentual}>
                      {percentual}%
                    </option>
                  ))}
                </select>
                <small>exemplo: preto/laranja com 70% deixa preto predominante</small>
              </div>

              <div className={styles.tagsList}>
                {formData.cores_disponiveis.map((cor, index) => (
                  <span key={index} className={styles.tag}>
                    {cor}
                    <button type="button" onClick={() => removerCor(index)}>×</button>
                  </span>
                ))}
              </div>

              {formData.cores_disponiveis.length > 0 && formData.tamanhos_disponiveis.length === 0 && (
                <div className={styles.sizeStockGrid}>
                  {formData.cores_disponiveis.map((cor) => {
                    const corKey = normalizeColor(cor);

                    return (
                      <div key={corKey} className={styles.sizeStockCard}>
                        <strong>{cor}</strong>
                        <label>Estoque disponível</label>
                        <input
                          type="number"
                          min="0"
                          value={displayZeroAsEmpty(Number(formData.estoque_cores[corKey] || 0))}
                          onChange={(e) => atualizarEstoquePorCor(cor, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Tamanhos Disponíveis</label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={tamanhoInput}
                  onChange={(e) => setTamanhoInput(e.target.value)}
                  placeholder="Ex: P, M, G, GG"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTamanho())}
                />
                <button type="button" onClick={adicionarTamanho} className={styles.btnAdd}>
                  Adicionar
                </button>
              </div>

              <div className={styles.tagsList}>
                {formData.tamanhos_disponiveis.map((tamanho, index) => (
                  <span key={index} className={styles.tag}>
                    {tamanho}
                    <button type="button" onClick={() => removerTamanho(index)}>×</button>
                  </span>
                ))}
              </div>

              {formData.tamanhos_disponiveis.length > 0 && formData.cores_disponiveis.length === 0 && (
                <div className={styles.sizeStockGrid}>
                  {formData.tamanhos_disponiveis.map((size) => {
                    const sizeKey = normalizeSize(size);

                    return (
                      <div key={sizeKey} className={styles.sizeStockCard}>
                        <strong>{sizeKey}</strong>
                        <label>Estoque disponível</label>
                        <input
                          type="number"
                          min="0"
                          value={displayZeroAsEmpty(Number(formData.estoque_tamanhos[sizeKey] || 0))}
                          onChange={(e) => atualizarEstoquePorTamanho(sizeKey, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {formData.tamanhos_disponiveis.length > 0 && formData.cores_disponiveis.length > 0 && (
                <div className={styles.sizeStockGrid}>
                  {formData.tamanhos_disponiveis.map((size) => {
                    const sizeKey = normalizeSize(size);

                    return formData.cores_disponiveis.map((color) => {
                      const colorKey = normalizeColor(color);
                      const variantKey = normalizeVariantKey(sizeKey, colorKey);

                      return (
                        <div key={variantKey} className={styles.sizeStockCard}>
                          <strong>{sizeKey} / {color}</strong>
                          <label>Estoque disponível</label>
                          <input
                            type="number"
                            min="0"
                            value={displayZeroAsEmpty(Number(formData.estoque_variantes[variantKey] || 0))}
                            onChange={(e) => atualizarEstoquePorVariacao(sizeKey, colorKey, e.target.value)}
                          />
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/admin/produtos" className={styles.btnCancel}>
              Cancelar
            </Link>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              <FiSave /> {loading ? 'Salvando...' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
