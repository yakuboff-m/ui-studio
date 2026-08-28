'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CodeIcon from '@mui/icons-material/Code';
import CssIcon from '@mui/icons-material/Css';
import DescriptionIcon from '@mui/icons-material/Description';
import styles from './CodeViewer.module.scss';

interface CodeViewerProps {
  usageCode: string;
  sourceCode?: string;
  scssCode?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  usageCode,
  sourceCode,
  scssCode,
}) => {
  const [activeTab, setActiveTab] = useState<'usage' | 'source' | 'scss'>('usage');
  const [copied, setCopied] = useState(false);

  const getActiveCodeText = () => {
    if (activeTab === 'usage') return usageCode;
    if (activeTab === 'source') return sourceCode || usageCode;
    if (activeTab === 'scss') return scssCode || '/* SCSS Module styles */';
    return usageCode;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCodeText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box className={styles.codeContainer}>
      <Box className={styles.codeHeader}>
        <Box className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'usage' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            <DescriptionIcon sx={{ fontSize: 14 }} />
            <span>Usage.tsx</span>
          </button>

          {sourceCode && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'source' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('source')}
            >
              <CodeIcon sx={{ fontSize: 14 }} />
              <span>Component.tsx</span>
            </button>
          )}

          {scssCode && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'scss' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('scss')}
            >
              <CssIcon sx={{ fontSize: 14 }} />
              <span>Component.module.scss</span>
            </button>
          )}
        </Box>

        <Button
          size="small"
          startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
          onClick={handleCopy}
          sx={{
            color: copied ? '#10b981' : '#64748b',
            textTransform: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </Box>

      <Box className={styles.codeBody}>
        <pre className={styles.preBlock}>
          <code>{getActiveCodeText()}</code>
        </pre>
      </Box>
    </Box>
  );
};
