'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { PropControlConfig, PropControlValue } from './types';
import styles from './FloatingControls.module.scss';

interface FloatingControlsProps {
  controls: PropControlConfig[];
  values: Record<string, PropControlValue>;
  onChange: (name: string, value: PropControlValue) => void;
  onReset?: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  controls,
  values,
  onChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!controls || controls.length === 0) return null;

  return (
    <div className={styles.floatingContainer}>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="pill-trigger"
            type="button"
            className={styles.pillTrigger}
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            aria-label="Open controls"
          >
            <SlidersHorizontal size={15} />
            <span>Controls</span>
            <span className={styles.countChip}>{controls.length}</span>
          </motion.button>
        ) : (
          <motion.div
            key="controls-card"
            className={styles.controlsCard}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <SlidersHorizontal size={15} color="#818cf8" />
                <Typography className={styles.cardTitle}>Props &amp; Controls</Typography>
                <span className={styles.countChip}>{controls.length}</span>
              </div>

              <div className={styles.headerActions}>
                {onReset && (
                  <Tooltip title="Reset to defaults">
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={onReset}
                      aria-label="Reset props to defaults"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </Tooltip>
                )}
                <Tooltip title="Minimize">
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setIsOpen(false)}
                    aria-label="Minimize controls"
                  >
                    <ChevronDown size={16} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Body */}
            <div className={styles.cardBody}>
              {controls.map((ctrl) => {
                const val = values[ctrl.name] ?? ctrl.defaultValue;

                return (
                  <div key={ctrl.name} className={styles.controlField}>
                    <div className={styles.controlLabelRow}>
                      <span className={styles.controlLabel}>{ctrl.name}</span>
                      {ctrl.type === 'number' && (
                        <span className={styles.controlValueBadge}>{Number(val)}</span>
                      )}
                      {ctrl.type === 'boolean' && (
                        <span className={styles.controlValueBadge}>
                          {Boolean(val) ? 'True' : 'False'}
                        </span>
                      )}
                    </div>

                    {ctrl.type === 'text' && (
                      <TextField
                        size="small"
                        fullWidth
                        value={String(val)}
                        onChange={(e) => onChange(ctrl.name, e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'action.hover',
                            color: 'text.primary',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            '& fieldset': {
                              borderColor: 'divider',
                            },
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                          '& .MuiInputBase-input': {
                            py: 0.8,
                            px: 1.2,
                          },
                        }}
                      />
                    )}

                    {ctrl.type === 'number' && (
                      <TextField
                        type="number"
                        size="small"
                        fullWidth
                        value={val !== undefined ? Number(val) : 0}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          onChange(ctrl.name, isNaN(parsed) ? 0 : parsed);
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'action.hover',
                            color: 'text.primary',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            '& fieldset': {
                              borderColor: 'divider',
                            },
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                          '& .MuiInputBase-input': {
                            py: 0.8,
                            px: 1.2,
                          },
                        }}
                      />
                    )}

                    {ctrl.type === 'boolean' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                          {Boolean(val) ? 'Enabled' : 'Disabled'}
                        </Typography>
                        <Switch
                          size="small"
                          checked={Boolean(val)}
                          onChange={(e) => onChange(ctrl.name, e.target.checked)}
                          color="primary"
                        />
                      </Box>
                    )}

                    {ctrl.type === 'select' && ctrl.options && (
                      <Select
                        size="small"
                        fullWidth
                        value={String(val)}
                        onChange={(e) => onChange(ctrl.name, e.target.value)}
                        sx={{
                          backgroundColor: 'action.hover',
                          color: 'text.primary',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          '& .MuiSelect-select': {
                            py: 0.8,
                            px: 1.2,
                          },
                          '& fieldset': {
                            borderColor: 'divider',
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                          '& .MuiSelect-icon': { color: 'text.secondary' },
                        }}
                      >
                        {ctrl.options.map((opt) => (
                          <MenuItem key={opt} value={opt} sx={{ fontSize: '0.82rem' }}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className={styles.cardFooter}>
              <span className={styles.liveIndicator}>Live interactive mode</span>
              <Sparkles size={13} color="#818cf8" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
