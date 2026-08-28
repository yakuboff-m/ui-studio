'use client';

import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import styles from './CustomInput.module.scss';

export type CustomInputProps = MuiTextFieldProps & {
  glowOnFocus?: boolean;
};

export const CustomInput: React.FC<CustomInputProps> = ({
  glowOnFocus = true,
  className = '',
  variant = 'outlined',
  fullWidth = true,
  ...props
}) => {
  return (
    <MuiTextField
      variant={variant}
      fullWidth={fullWidth}
      className={`${styles.inputWrapper} ${className}`}
      {...props}
    />
  );
};
