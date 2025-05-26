import { ButtonHTMLAttributes, FC } from 'react';
import styles from './styles.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className={styles.spinner} role="status" aria-label="載入中">
          ⟳
        </span>
      ) : null}
      {children}
    </button>
  );
};

export default Button; 