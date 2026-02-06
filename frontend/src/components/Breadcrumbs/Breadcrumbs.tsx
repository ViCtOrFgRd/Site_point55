'use client';

import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import styles from './Breadcrumbs.module.scss';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="breadcrumb">
      <ol className={styles.breadcrumbList}>
        <li className={styles.breadcrumbItem}>
          <Link href="/" className={styles.breadcrumbLink}>
            <FiHome />
            <span>Início</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className={styles.breadcrumbItem}>
            <FiChevronRight className={styles.separator} />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
