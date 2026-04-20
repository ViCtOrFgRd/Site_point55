/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save } from 'lucide-react';
import { bannerService } from '@/services/api';
import { useNotification } from '@/hooks/useNotification';
import { confirmDelete, showSuccess, showError } from '@/utils/alerts';
import styles from './banners.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Banner {
  id: number;
  titulo: string;
  subtitulo?: string;
  texto_botao?: string;
  link_botao?: string;
  imagem?: string;
  cor_fundo: string;
  ordem: number;
  ativo: boolean;
  data_inicio?: string;
  data_fim?: string;
  data_criacao: string;
}

export default function BannersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagemTipo, setImagemTipo] = useState<'url' | 'upload'>('url');
  const [formData, setFormData] = useState({
    titulo: '',
    subtitulo: '',
    texto_botao: '',
    link_botao: '',
    imagem: '',
    cor_fundo: '#0C1C3A',
    ordem: 0,
    ativo: true,
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.is_admin) {
      carregarBanners();
    }
  }, [user]);

  const carregarBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getAll(false);
      if (response.success && response.data) {
        setBanners(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar banners:', error);
      showError('Erro ao carregar banners: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        titulo: banner.titulo,
        subtitulo: banner.subtitulo || '',
        texto_botao: banner.texto_botao || '',
        link_botao: banner.link_botao || '',
        imagem: banner.imagem || '',
        cor_fundo: banner.cor_fundo || '#0C1C3A',
        ordem: banner.ordem,
        ativo: banner.ativo,
        data_inicio: banner.data_inicio ? banner.data_inicio.split('T')[0] : '',
        data_fim: banner.data_fim ? banner.data_fim.split('T')[0] : '',
      });
    } else {
      setEditingBanner(null);
      setFormData({
        titulo: '',
        subtitulo: '',
        texto_botao: 'Ver Mais',
        link_botao: '/produtos',
        imagem: '',
        cor_fundo: '#0C1C3A',
        ordem: banners.length,
        ativo: true,
        data_inicio: '',
        data_fim: '',
      });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImagemTipo('url');
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
        // Usar a URL da imagem (verificar se precisa do host)
        const imageUrl = data.data.url.startsWith('http') 
          ? data.data.url 
          : `${API_URL.replace('/api', '')}${data.data.url}`;
        
        setFormData(prev => ({
          ...prev,
          imagem: imageUrl,
        }));
        showSuccess('Imagem enviada com sucesso!');
      } else {
        showError(data.message || 'Erro ao fazer upload da imagem');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      showError('Erro ao fazer upload da imagem: ' + error.message);
    } finally {
      setUploading(false);
      // Limpar o input file
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      showError('O título é obrigatório');
      return;
    }

    try {
      const dataToSend: any = {
        titulo: formData.titulo,
        subtitulo: formData.subtitulo || undefined,
        texto_botao: formData.texto_botao || undefined,
        link_botao: formData.link_botao || undefined,
        imagem: formData.imagem || undefined,
        cor_fundo: formData.cor_fundo,
        ordem: formData.ordem,
        ativo: formData.ativo,
        data_inicio: formData.data_inicio || undefined,
        data_fim: formData.data_fim || undefined,
      };

      if (editingBanner) {
        await bannerService.update(editingBanner.id, dataToSend);
        showSuccess('Banner atualizado com sucesso!');
      } else {
        await bannerService.create(dataToSend);
        showSuccess('Banner criado com sucesso!');
      }

      fecharModal();
      carregarBanners();
    } catch (error: any) {
      console.error('Erro ao salvar banner:', error);
      showError('Erro ao salvar banner: ' + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    const shouldDelete = await confirmDelete('Excluir Banner?', 'Esta ação não pode ser desfeita!');

    if (!shouldDelete) {
      return;
    }

    try {
      await bannerService.delete(id);
      showSuccess('Banner excluído com sucesso!');
      carregarBanners();
    } catch (error: any) {
      console.error('Erro ao excluir banner:', error);
      showError('Erro ao excluir banner: ' + error.message);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await bannerService.toggle(id);
      carregarBanners();
    } catch (error: any) {
      console.error('Erro ao alternar status:', error);
      showError('Erro ao alternar status: ' + error.message);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
    
    const reorderedBanners = newBanners.map((b, i) => ({ id: b.id, ordem: i }));
    
    try {
      await bannerService.reorder(reorderedBanners);
      carregarBanners();
    } catch (error: any) {
      console.error('Erro ao reordenar:', error);
      showError('Erro ao reordenar: ' + error.message);
    }
  };

  const moveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    
    const reorderedBanners = newBanners.map((b, i) => ({ id: b.id, ordem: i }));
    
    try {
      await bannerService.reorder(reorderedBanners);
      carregarBanners();
    } catch (error: any) {
      console.error('Erro ao reordenar:', error);
      showError('Erro ao reordenar: ' + error.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.bannersPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/admin" className={styles.backButton}>
              <ArrowLeft size={18} /> Voltar
            </Link>
            <h1>Gerenciar Banners</h1>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.addButton} onClick={() => abrirModal()}>
              <Plus size={18} /> Novo Banner
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total de Banners</span>
            <span className={styles.statValue}>{banners.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Banners Ativos</span>
            <span className={styles.statValue}>
              {banners.filter(b => b.ativo).length}
            </span>
          </div>
        </div>

        {banners.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum banner cadastrado</p>
            <button className={styles.addButton} onClick={() => abrirModal()}>
              <Plus /> Criar Primeiro Banner
            </button>
          </div>
        ) : (
          <div className={styles.bannersGrid}>
            {banners.map((banner, index) => (
              <div key={banner.id} className={styles.bannerCard}>
                <div className={styles.bannerPreview} style={{ backgroundColor: banner.cor_fundo }}>
                  {banner.imagem && (
                    <img src={banner.imagem} alt={banner.titulo} />
                  )}
                  <div className={styles.bannerOverlay}>
                    <h3>{banner.titulo}</h3>
                    {banner.subtitulo && <p>{banner.subtitulo}</p>}
                  </div>
                </div>

                <div className={styles.bannerInfo}>
                  <div className={styles.bannerStatus}>
                    <span className={`${styles.badge} ${banner.ativo ? styles.active : styles.inactive}`}>
                      {banner.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className={styles.ordem}>Ordem: {banner.ordem}</span>
                  </div>

                  <div className={styles.bannerDetails}>
                    {banner.texto_botao && (
                      <p><strong>Botão:</strong> {banner.texto_botao}</p>
                    )}
                    {banner.link_botao && (
                      <p><strong>Link:</strong> {banner.link_botao}</p>
                    )}
                  </div>

                  <div className={styles.bannerActions}>
                    <button
                      onClick={() => handleToggleStatus(banner.id)}
                      className={styles.iconButton}
                      title={banner.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {banner.ativo ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    
                    <div className={styles.moveButtons}>
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className={styles.iconButton}
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === banners.length - 1}
                        className={styles.iconButton}
                        title="Mover para baixo"
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      onClick={() => abrirModal(banner)}
                      className={styles.iconButton}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className={`${styles.iconButton} ${styles.danger}`}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
              <button onClick={fecharModal} className={styles.closeButton}>×</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  placeholder="Ex: MEGA BAZAR"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Subtítulo</label>
                <input
                  type="text"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  placeholder="Ex: Até 70% OFF em peças selecionadas"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Texto do Botão</label>
                  <input
                    type="text"
                    value={formData.texto_botao}
                    onChange={(e) => setFormData({ ...formData, texto_botao: e.target.value })}
                    placeholder="Ex: Ver Ofertas"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Link do Botão</label>
                  <input
                    type="text"
                    value={formData.link_botao}
                    onChange={(e) => setFormData({ ...formData, link_botao: e.target.value })}
                    placeholder="Ex: /promocoes"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Imagem do Banner</label>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ marginRight: '1rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="url"
                      checked={imagemTipo === 'url'}
                      onChange={(e) => setImagemTipo('url')}
                      style={{ marginRight: '0.5rem' }}
                    />
                    URL da Imagem
                  </label>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="upload"
                      checked={imagemTipo === 'upload'}
                      onChange={(e) => setImagemTipo('upload')}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Upload de Arquivo
                  </label>
                </div>

                {imagemTipo === 'url' ? (
                  <input
                    type="text"
                    value={formData.imagem}
                    onChange={(e) => setFormData({ ...formData, imagem: e.target.value })}
                    placeholder="Ex: /images/banner1.jpg"
                  />
                ) : (
                  <div>
                    <input
                      type="file"
                      id="upload-banner-imagem"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleUploadImagem}
                      disabled={uploading}
                      style={{ display: 'block', marginBottom: '0.5rem' }}
                    />
                    <small>Formatos aceitos: JPEG, PNG, GIF, WEBP (máx. 5MB)</small>
                    {uploading && <p style={{ marginTop: '0.5rem', color: '#666' }}>Enviando...</p>}
                  </div>
                )}

                {formData.imagem && (
                  <div style={{ marginTop: '1rem' }}>
                    <small>Preview:</small>
                    <img 
                      src={formData.imagem} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: '150px', marginTop: '0.5rem', borderRadius: '4px' }}
                    />
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cor de Fundo</label>
                  <div className={styles.colorPicker}>
                    <input
                      type="color"
                      value={formData.cor_fundo}
                      onChange={(e) => setFormData({ ...formData, cor_fundo: e.target.value })}
                    />
                    <input
                      type="text"
                      value={formData.cor_fundo}
                      onChange={(e) => setFormData({ ...formData, cor_fundo: e.target.value })}
                      placeholder="#0C1C3A"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Ordem</label>
                  <input
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Data Início (opcional)</label>
                  <input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Data Fim (opcional)</label>
                  <input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  <span>Banner Ativo</span>
                </label>
              </div>

              {/* Preview */}
              <div className={styles.previewSection}>
                <h3>Preview</h3>
                <div className={styles.previewBanner} style={{ backgroundColor: formData.cor_fundo }}>
                  <div className={styles.previewContent}>
                    <h2>{formData.titulo || 'Título do Banner'}</h2>
                    <p>{formData.subtitulo || 'Subtítulo do banner'}</p>
                    {formData.texto_botao && (
                      <button className={styles.previewButton}>{formData.texto_botao}</button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={fecharModal} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveButton}>
                  <Save size={18} /> {editingBanner ? 'Atualizar' : 'Criar'} Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
