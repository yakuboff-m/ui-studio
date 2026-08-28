'use client';

import React from 'react';
import { Chip as MuiChip, ChipProps as MuiChipProps, Box } from '@mui/material';
import styles from './CustomBadge.module.scss';

export interface CustomBadgeProps extends Omit<MuiChipProps, 'variant'> {
  status?: 'active' | 'busy' | 'warning' | 'gradient';
  pulse?: boolean;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
  label,
  status = 'active',
  pulse = true,
  className = '',
  ...props
}) => {
  let statusClass = styles.statusActive;
  if (status === 'busy') statusClass = styles.statusBusy;
  if (status === 'warning') statusClass = styles.statusWarning;
  if (status === 'gradient') statusClass = styles.statusGradient;

  return (
    <MuiChip
      label={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {pulse && <span className={styles.pulseDot} />}
          {label}
        </Box>
      }
      className={`${styles.badgeChip} ${statusClass} ${className}`}
      {...props}
    />
  );
};
