'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import { productService, categoryService } from '@/services/api';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import styles from './produto-form.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProdutoFormPage() {
  const { user, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const router = useRouter();
  const params = useParams();
  const produtoId = params?.id as string;
  const isEditing = !!produtoId && produtoId !== 'novo';

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
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
    ativo: true,
  });

  const [usarMesmoValorPagamentos, setUsarMesmoValorPagamentos] = useState(true);

  const [imagemInput, setImagemInput] = useState('');
  const [imagemTipo, setImagemTipo] = useState<'url' | 'upload'>('url');
  const [corInput, setCorInput] = useState('');
  const [tamanhoInput, setTamanhoInput] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarCategorias();
      if (isEditing) {
        carregarProduto();
      }
    }
  }, [user, isEditing, produtoId]);

  const carregarCategorias = async () => {
    try {
      const response = await categoryService.getAllAdmin();
      if (response.success) {
        setCategorias(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarProduto = async () => {
    setLoading(true);
    try {
      const response = await productService.getById(parseInt(produtoId));
      if (response.success && response.data) {
        const produto = response.data;
        const categoriaIds = Array.isArray(produto.categoria_ids) && produto.categoria_ids.length > 0
          ? produto.categoria_ids.map((id: number) => String(id))
          : produto.categoria_id
          ? [String(produto.categoria_id)]
          : [];

        const precoBase = produto.preco || 0;
        const precoCredito = produto.preco_credito ?? precoBase;
        const precoDebito = produto.preco_debito ?? precoBase;
        const precoBoleto = produto.preco_boleto ?? precoBase;

        setFormData({
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          preco: produto.preco || 0,
          preco_pix: produto.preco_pix ?? precoBase,
          preco_debito: precoDebito,
          preco_credito: precoCredito,
          preco_boleto: precoBoleto,
          preco_original: produto.preco_original || 0,
          parcelas_maximas: produto.parcelas_maximas || 3,
          desconto_percentual: produto.desconto_percentual || 0,
          categoria_id: categoriaIds[0] || '',
          categoria_ids: categoriaIds,
          estoque: produto.estoque || 0,
          imagens: produto.imagens || [],
          cores_disponiveis: produto.cores_disponiveis || [],
          tamanhos_disponiveis: produto.tamanhos_disponiveis || [],
          ativo: produto.ativo !== false,
        });

        setUsarMesmoValorPagamentos(precoCredito === precoDebito && precoCredito === precoBoleto);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto');
    } finally {
      setLoading(false);
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
      const data = {
        ...formData,
        categoria_id: categoriaIds[0] || parseInt(formData.categoria_id, 10),
        categoria_ids: categoriaIds,
        preco: parseFloat(formData.preco.toString()),
        preco_pix: formData.preco_pix > 0 ? parseFloat(formData.preco_pix.toString()) : parseFloat(formData.preco.toString()),
        preco_debito: formData.preco_debito > 0 ? parseFloat(formData.preco_debito.toString()) : parseFloat(formData.preco.toString()),
        preco_credito: formData.preco_credito > 0 ? parseFloat(formData.preco_credito.toString()) : parseFloat(formData.preco.toString()),
        preco_boleto: formData.preco_boleto > 0 ? parseFloat(formData.preco_boleto.toString()) : parseFloat(formData.preco.toString()),
        preco_original: formData.preco_original && formData.preco_original > 0 ? parseFloat(formData.preco_original.toString()) : null,
        parcelas_maximas: parseInt(formData.parcelas_maximas.toString(), 10) || 3,
        desconto_percentual: parseFloat(formData.desconto_percentual.toString()) || 0,
        estoque: parseInt(formData.estoque.toString()),
      };

      if (isEditing) {
        const response = await productService.update(parseInt(produtoId), data);
        if (response.success) {
          success('Produto atualizado com sucesso!');
          router.push('/admin/produtos');
        }
      } else {
        const response = await productService.create(data);
        if (response.success) {
          success('Produto criado com sucesso!');
          router.push('/admin/produtos');
        }
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

  const adicionarCor = () => {
    if (corInput.trim() && !formData.cores_disponiveis.includes(corInput.trim())) {
      setFormData({
        ...formData,
        cores_disponiveis: [...formData.cores_disponiveis, corInput.trim()],
      });
      setCorInput('');
    }
  };

  const removerCor = (index: number) => {
    setFormData({
      ...formData,
      cores_disponiveis: formData.cores_disponiveis.filter((_, i) => i !== index),
    });
  };

  const adicionarTamanho = () => {
    if (tamanhoInput.trim() && !formData.tamanhos_disponiveis.includes(tamanhoInput.trim())) {
      setFormData({
        ...formData,
        tamanhos_disponiveis: [...formData.tamanhos_disponiveis, tamanhoInput.trim()],
      });
      setTamanhoInput('');
    }
  };

  const removerTamanho = (index: number) => {
    setFormData({
      ...formData,
      tamanhos_disponiveis: formData.tamanhos_disponiveis.filter((_, i) => i !== index),
    });
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

  if (authLoading || (isEditing && loading)) {
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
          <h1>{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formCard}>
            <h2>Informações Básicas</h2>
            
            <div className={styles.formGroup}>
              <label>Nome do Produto *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                placeholder="Ex: Camiseta Básica"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Descrição</label>
              <textarea
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
          </div>

          <div className={styles.formCard}>
            <h2>Preços e Promoção</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Preço Atual (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      preco_original: val && val.trim() ? parseFloat(val) : 0 
                    });
                  }}
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
                  onChange={(e) => setFormData({ ...formData, parcelas_maximas: parseInt(e.target.value) || 1 })}
                  placeholder="3"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no PIX (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_pix}
                  onChange={(e) => setFormData({ ...formData, preco_pix: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no Credito (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_credito}
                  onChange={(e) => handleCreditoChange(parseFloat(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Preço no Debito (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_debito}
                  onChange={(e) => setFormData({ ...formData, preco_debito: parseFloat(e.target.value) })}
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
                  value={formData.preco_boleto}
                  onChange={(e) => setFormData({ ...formData, preco_boleto: parseFloat(e.target.value) })}
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
                value={formData.estoque}
                onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) })}
                required
                placeholder="0"
              />
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
                <label htmlFor="upload-imagem-edit" className={styles.uploadLabel}>
                  {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImagem}
                  disabled={uploading}
                  id="upload-imagem-edit"
                  className={styles.uploadInput}
                />
                <small>Máximo 5MB (JPEG, PNG, GIF, WEBP)</small>
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
              <label>Cores Disponíveis</label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={corInput}
                  onChange={(e) => setCorInput(e.target.value)}
                  placeholder="Ex: Preto, Branco, Azul"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarCor())}
                />
                <button type="button" onClick={adicionarCor} className={styles.btnAdd}>
                  Adicionar
                </button>
              </div>
              <div className={styles.tagsList}>
                {formData.cores_disponiveis.map((cor, index) => (
                  <span key={index} className={styles.tag}>
                    {cor}
                    <button type="button" onClick={() => removerCor(index)}>×</button>
                  </span>
                ))}
              </div>
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
                {formData.tamanhos_disponiveis.map((tam, index) => (
                  <span key={index} className={styles.tag}>
                    {tam}
                    <button type="button" onClick={() => removerTamanho(index)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <h2>Status</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
                Produto ativo e visível na loja
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <Link href="/admin/produtos" className={styles.btnCancel}>
              Cancelar
            </Link>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              <FiSave />
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar') + ' Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
