'use client';

import React from 'react';
import { Card as MuiCard, CardProps as MuiCardProps, Box, Typography } from '@mui/material';
import styles from './CustomCard.module.scss';

export interface CustomCardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  variantType?: 'glass' | 'solid' | 'neon';
  hover?: boolean;
  topGlow?: boolean;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  title,
  subtitle,
  action,
  variantType = 'glass',
  hover = true,
  topGlow = true,
  className = '',
  ...props
}) => {
  let computedClassName = `${styles.cardContainer} ${className}`;
  if (variantType === 'glass') computedClassName += ` ${styles.glassVariant}`;
  if (hover) computedClassName += ` ${styles.hoverEffect}`;
  if (topGlow) computedClassName += ` ${styles.glowBorder}`;

  return (
    <MuiCard className={computedClassName} {...props}>
      {(title || action) && (
        <Box className={styles.cardHeader}>
          <Box>
            {title && <Typography className={styles.cardTitle}>{title}</Typography>}
            {subtitle && <Typography className={styles.cardSub}>{subtitle}</Typography>}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      )}
      {children}
    </MuiCard>
  );
};
