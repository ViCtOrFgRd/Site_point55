import styles from './CategoryBadges.module.scss';

interface CategoryBadgesProps {
  categories: string[];
  maxDisplay?: number;
  size?: 'small' | 'medium' | 'large';
}

export default function CategoryBadges({
  categories,
  maxDisplay = 3,
  size = 'small',
}: CategoryBadgesProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const displayed = categories.slice(0, maxDisplay);
  const remaining = categories.length - maxDisplay;

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      {displayed.map((category, idx) => (
        <span key={idx} className={styles.badge}>
          {category}
        </span>
      ))}
      {remaining > 0 && (
        <span className={`${styles.badge} ${styles.moreIndicator}`}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
