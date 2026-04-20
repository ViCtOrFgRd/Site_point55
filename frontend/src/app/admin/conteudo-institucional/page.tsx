/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { institutionalContentService } from '@/services/api';
import { showError, showSuccess } from '@/utils/alerts';
import styles from '../admin.module.scss';

interface ConteudoInstitucional {
  slug: string;
  titulo: string;
  resumo?: string;
  conteudo_html?: string;
  ativo: boolean;
  ordem: number;
  atualizado_em?: string;
}

const normalizeUtf8 = (value?: string): string => {
  if (!value) return '';

  const hasPossibleMojibake = /Ã.|Â.|â.|├|�/.test(value);
  if (!hasPossibleMojibake) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded || value;
  } catch {
    return value;
  }
};

const SLOTS_PADRAO = [
  { slug: 'sobre', label: 'Sobre Nós' },
  { slug: 'politica', label: 'Política de Privacidade' },
  { slug: 'termos', label: 'Termos de Uso' },
  { slug: 'trocas', label: 'Trocas e Devoluções' },
  { slug: 'faq', label: 'FAQ - Perguntas Frequentes' },
  { slug: 'satisfacao', label: 'Pesquisa de Satisfação' },
  { slug: 'tabela-medidas', label: 'Tabela de Medidas' },
  { slug: 'frete', label: 'Política de Frete' },
];

export default function ConteudoInstitucionalAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itens, setItens] = useState<ConteudoInstitucional[]>([]);
  const [slugSelecionado, setSlugSelecionado] = useState('sobre');
  const [form, setForm] = useState<ConteudoInstitucional>({
    slug: 'sobre',
    titulo: 'Sobre Nós',
    resumo: '',
    conteudo_html: '',
    ativo: true,
    ordem: 1,
  });

  const displayZeroAsEmpty = (value: number) => (value === 0 ? '' : value);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/perfil');
    }
  }, [authLoading, user, router]);

  const loadLista = async () => {
    try {
      const response = await institutionalContentService.getAllAdmin();
      if (response.success && response.data) {
        const itensData: any[] = Array.isArray(response.data) ? response.data : [];
        setItens(
          itensData.map((item: any) => ({
            ...item,
            titulo: normalizeUtf8(item.titulo),
            resumo: normalizeUtf8(item.resumo || ''),
          }))
        );
      }
    } catch (error: any) {
      showError(error?.message || 'Erro ao carregar lista de conteúdos');
    }
  };

  const loadConteudo = async (slug: string) => {
    try {
      setLoading(true);
      const response = await institutionalContentService.getBySlugAdmin(slug);

      if (response.success && response.data) {
        const conteudoData: any = response.data;
        setForm({
          slug: conteudoData.slug,
          titulo: normalizeUtf8(conteudoData.titulo || ''),
          resumo: normalizeUtf8(conteudoData.resumo || ''),
          conteudo_html: normalizeUtf8(conteudoData.conteudo_html || ''),
          ativo: conteudoData.ativo !== false,
          ordem: Number(conteudoData.ordem || 0),
          atualizado_em: conteudoData.atualizado_em,
        });
      }
    } catch (error: any) {
      showError(error?.message || 'Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      Promise.all([loadLista(), loadConteudo(slugSelecionado)]);
    }
  }, [user]);

  useEffect(() => {
    if (user?.is_admin) {
      loadConteudo(slugSelecionado);
    }
  }, [slugSelecionado]);

  const slots = useMemo(() => {
    const fromApi = itens.map((item) => ({ slug: item.slug, label: item.titulo || item.slug }));
    const merged = [...SLOTS_PADRAO];

    fromApi.forEach((item) => {
      if (!merged.some((slot) => slot.slug === item.slug)) {
        merged.push(item);
      }
    });

    return merged;
  }, [itens]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      showError('Título é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const response = await institutionalContentService.upsert(form.slug, {
        titulo: form.titulo,
        resumo: form.resumo || '',
        conteudo_html: form.conteudo_html || '',
        ativo: form.ativo,
        ordem: Number(form.ordem || 0),
      });

      if (response.success) {
        showSuccess('Conteúdo institucional salvo com sucesso!');
        await loadLista();
        await loadConteudo(form.slug);
      }
    } catch (error: any) {
      showError(error?.message || 'Erro ao salvar conteúdo');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <FileText className={styles.spinner} />
          <p>Carregando conteúdo institucional...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link href="/admin" className={styles.backButton}>
            <ArrowLeft size={20} />
            Voltar para Admin
          </Link>
          <h1 className={styles.title}>
            <FileText size={32} />
            Conteúdo Institucional
          </h1>
          <p className={styles.subtitle}>Gerencie o texto das páginas institucionais do site</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Página</label>
            <select
              className={styles.select}
              value={slugSelecionado}
              onChange={(e) => {
                const nextSlug = e.target.value;
                setSlugSelecionado(nextSlug);
                setForm((prev) => ({ ...prev, slug: nextSlug }));
              }}
            >
              {slots.map((slot) => (
                <option key={slot.slug} value={slot.slug}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Ordem</label>
            <input
              type="number"
              min={0}
              value={displayZeroAsEmpty(form.ordem)}
              onChange={(e) => setForm({ ...form, ordem: Number(e.target.value || 0) })}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              className={styles.select}
              value={form.ativo ? 'ativo' : 'inativo'}
              onChange={(e) => setForm({ ...form, ativo: e.target.value === 'ativo' })}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer} style={{ padding: '1.25rem' }}>
          <div className={styles.filterGroup} style={{ marginBottom: '1rem' }}>
            <label>Título</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd' }}
              required
            />
          </div>

          <div className={styles.filterGroup} style={{ marginBottom: '1rem' }}>
            <label>Resumo</label>
            <textarea
              value={form.resumo || ''}
              onChange={(e) => setForm({ ...form, resumo: e.target.value })}
              rows={3}
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Conteúdo (HTML)</label>
            <textarea
              value={form.conteudo_html || ''}
              onChange={(e) => setForm({ ...form, conteudo_html: e.target.value })}
              rows={18}
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>

          {form.atualizado_em ? (
            <p style={{ marginTop: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
              Última atualização: {new Date(form.atualizado_em).toLocaleString('pt-BR')}
            </p>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Conteúdo'}
          </button>
        </div>
      </form>
    </div>
  );
}
