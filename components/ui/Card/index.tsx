import { FC, HTMLAttributes } from 'react';
import styles from './styles.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'elevated';
  noPadding?: boolean;
}

const Card: FC<CardProps> = ({
  children,
  title,
  variant = 'default',
  noPadding = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${noPadding ? styles.noPadding : ''} ${className}`}
      {...props}
      role="article"
    >
      {title && (
        <h3 className={styles.title} role="heading">
          {title}
        </h3>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Card; 