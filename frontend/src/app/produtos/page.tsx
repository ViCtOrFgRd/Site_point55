import { Suspense } from 'react';
import ProdutosPageClient from './ProdutosPageClient';

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div>Carregando produtos...</div>}>
      <ProdutosPageClient />
    </Suspense>
  );
}
