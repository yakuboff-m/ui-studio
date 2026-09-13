'use client';

import React, { useState, useId } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import styles from './Checkbox.module.scss';

export interface MotionCheckboxProps {
  /**
   * Controlled checked state.
   */
  checked?: boolean;
  /**
   * Initial checked state for uncontrolled mode. Defaults to false.
   */
  defaultChecked?: boolean;
  /**
   * Callback fired when checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Whether the checkbox is disabled.
   */
  disabled?: boolean;
  /**
   * Optional custom accent color (e.g. #8df0cc, #6366f1, #06b6d4).
   */
  color?: string;
  /**
   * Size variant: 'sm' (24px), 'md' (32px), 'lg' (40px). Defaults to 'md'.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional label displayed alongside checkbox.
   */
  label?: React.ReactNode;
  /**
   * Unique element id for label association.
   */
  id?: string;
  /**
   * Custom className for root container.
   */
  className?: string;
  /**
   * Custom inline styles for root container.
   */
  style?: React.CSSProperties;
}

export const Checkbox: React.FC<MotionCheckboxProps> = ({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  color,
  size = 'md',
  label,
  id,
  className = '',
  style,
}) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

  // Path length motion value initialized to current checked state
  const pathLength = useMotionValue(isChecked ? 1 : 0);

  // Dynamic stroke-linecap: 'none' when length is 0 (avoids visible dot artifact), 'round' when drawn
  const strokeLinecap = useTransform(() => (pathLength.get() === 0 ? 'none' : 'round'));

  const handleCheckedChange = (nextChecked: boolean) => {
    if (disabled) return;
    if (!isControlled) {
      setInternalChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  };

  const sizeClass = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...(color ? ({ '--hue-6': color } as React.CSSProperties) : {}),
  };

  return (
    <div className={`${styles.container} ${className}`} style={containerStyle}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        checked={isChecked}
        onCheckedChange={(checked) => handleCheckedChange(checked === true)}
        disabled={disabled}
        asChild
      >
        <motion.button
          type="button"
          className={`${styles.root} ${sizeClass}`}
          whileHover={disabled ? undefined : { scale: 1.05 }}
          whileTap={disabled ? undefined : { scale: 0.95 }}
          data-primary-action="true"
          aria-label={typeof label === 'string' ? label : 'Checkbox'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--hue-6)"
            strokeWidth="3"
            className={styles.svgIcon}
          >
            <motion.path
              d="M4 12L10 18L20 6"
              initial={false}
              animate={{ pathLength: isChecked ? 1 : 0 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: isChecked ? 0.3 : 0.1,
              }}
              style={{
                pathLength,
                strokeLinecap,
              }}
            />
          </svg>
        </motion.button>
      </CheckboxPrimitive.Root>

      {label && (
        <label
          htmlFor={checkboxId}
          className={`${styles.label} ${disabled ? styles.disabled : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
