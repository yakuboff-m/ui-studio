'use client';

import React from 'react';
import { Box } from '@mui/material';
import styles from './Canvas.module.scss';

export type CanvasBgMode = 'dark' | 'light' | 'mesh' | 'grid';
export type CanvasDeviceMode = 'desktop' | 'tablet' | 'mobile';

interface CanvasProps {
  children: React.ReactNode;
  bgMode: CanvasBgMode;
  deviceMode: CanvasDeviceMode;
}

export const Canvas: React.FC<CanvasProps> = ({ children, bgMode, deviceMode }) => {
  let bgClass = styles.bgDark;
  if (bgMode === 'light') bgClass = styles.bgLight;
  if (bgMode === 'mesh') bgClass = styles.bgMesh;
  if (bgMode === 'grid') bgClass = styles.bgGrid;

  let deviceClass = styles.deviceDesktop;
  if (deviceMode === 'tablet') deviceClass = styles.deviceTablet;
  if (deviceMode === 'mobile') deviceClass = styles.deviceMobile;

  return (
    <Box className={`${styles.canvasWrapper} ${bgClass}`}>
      <Box className={`${styles.previewFrame} ${deviceClass}`}>
        {children}
      </Box>
    </Box>
  );
};
