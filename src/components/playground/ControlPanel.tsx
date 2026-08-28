'use client';

import React from 'react';
import { Box, Typography, TextField, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import { PropControlConfig, PropControlValue } from './types';
import styles from './ControlPanel.module.scss';

interface ControlPanelProps {
  controls: PropControlConfig[];
  values: Record<string, PropControlValue>;
  onChange: (name: string, value: PropControlValue) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ controls, values, onChange }) => {
  return (
    <Box className={styles.panelContainer}>
      <Typography className={styles.panelTitle}>Props Inspector</Typography>

      {controls.map((ctrl) => {
        const val = values[ctrl.name] ?? ctrl.defaultValue;

        return (
          <Box key={ctrl.name} className={styles.controlGroup}>
            <Typography className={styles.controlLabel}>{ctrl.name}</Typography>
            {ctrl.description && <Typography className={ctrl.description}>{ctrl.description}</Typography>}

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
                    borderRadius: '8px',
                  },
                }}
              />
            )}

            {ctrl.type === 'boolean' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(val)}
                    onChange={(e) => onChange(ctrl.name, e.target.checked)}
                    color="primary"
                  />
                }
                label={Boolean(val) ? 'Enabled' : 'Disabled'}
                sx={{ color: 'text.secondary' }}
              />
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
                  borderRadius: '8px',
                  '& .MuiSelect-icon': { color: 'text.secondary' },
                }}
              >
                {ctrl.options.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
