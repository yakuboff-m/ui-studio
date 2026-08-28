'use client';

import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import styles from './CustomButton.module.scss';

export interface CustomButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'glow' | 'glass' | 'neon' | 'contained' | 'outlined' | 'text';
  loading?: boolean;
  pulse?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  variant = 'glow',
  loading = false,
  pulse = false,
  className = '',
  disabled,
  ...props
}) => {
  let computedClassName = className;
  let muiVariant: MuiButtonProps['variant'] = 'contained';

  if (variant === 'glow') {
    computedClassName += ` ${styles.buttonGlow}`;
    muiVariant = 'contained';
  } else if (variant === 'glass') {
    computedClassName += ` ${styles.buttonGlass}`;
    muiVariant = 'outlined';
  } else if (variant === 'neon') {
    computedClassName += ` ${styles.buttonNeon}`;
    muiVariant = 'outlined';
  } else {
    muiVariant = variant;
  }

  if (pulse) {
    computedClassName += ` ${styles.pulseEffect}`;
  }

  return (
    <MuiButton
      variant={muiVariant}
      disabled={disabled || loading}
      className={computedClassName}
      {...props}
    >
      {loading ? <CircularProgress size={22} color="inherit" /> : children}
    </MuiButton>
  );
};
