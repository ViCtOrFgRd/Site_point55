/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { institutionalContentService } from '@/services/api';
import styles from './InstitutionalContentPage.module.scss';

interface InstitutionalContentPageProps {
  slug: string;
  breadcrumbLabel: string;
  defaultTitle: string;
}

interface ConteudoInstitucional {
  slug: string;
  titulo: string;
  resumo?: string;
  conteudo_html?: string;
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

export default function InstitutionalContentPage({
  slug,
  breadcrumbLabel,
  defaultTitle,
}: InstitutionalContentPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conteudo, setConteudo] = useState<ConteudoInstitucional | null>(null);

  const carregarConteudo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await institutionalContentService.getBySlug(slug);

      if (!response.success || !response.data) {
        setConteudo(null);
        setError('Conteúdo indisponível no momento.');
        return;
      }

      const conteudoData: any = response.data;

      setConteudo({
        ...conteudoData,
        slug: String(conteudoData.slug || slug),
        titulo: normalizeUtf8(conteudoData.titulo || defaultTitle),
        resumo: normalizeUtf8(conteudoData.resumo || ''),
        conteudo_html: normalizeUtf8(conteudoData.conteudo_html || ''),
      });
    } catch (err: any) {
      setConteudo(null);
      setError(err?.message || 'Não foi possível carregar o conteúdo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConteudo();
  }, [slug]);

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: breadcrumbLabel }]} />

        <div className={styles.hero}>
          <h1>{conteudo?.titulo || defaultTitle}</h1>
          {conteudo?.resumo ? <p>{conteudo.resumo}</p> : null}
        </div>

        {loading ? (
          <div className={styles.loading}>Carregando conteúdo...</div>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button type="button" className={styles.retryButton} onClick={carregarConteudo}>
              Tentar novamente
            </button>
          </div>
        ) : conteudo?.conteudo_html ? (
          <article
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: conteudo.conteudo_html }}
          />
        ) : (
          <div className={styles.empty}>Conteúdo ainda não publicado.</div>
        )}
      </div>
    </div>
  );
}
