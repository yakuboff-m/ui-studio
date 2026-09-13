'use client';

import React, { useState } from 'react';
import { LayoutGroup, motion, MotionProps } from 'framer-motion';
import { AnimateNumber } from '@/components/ui/LineGraph/AnimateNumber';
import styles from './NumberCounter.module.scss';

export interface NumberCounterProps {
  /**
   * Minimum allowed value. Default: -Infinity
   */
  min?: number;
  /**
   * Maximum allowed value. Default: Infinity
   */
  max?: number;
  /**
   * Step increment/decrement. Default: 1
   */
  step?: number;
  /**
   * Default initial value in uncontrolled mode. Default: 0
   */
  defaultValue?: number;
  /**
   * Current controlled value.
   */
  value?: number;
  /**
   * Callback fired when value changes.
   */
  onChange?: (val: number) => void;
  /**
   * Whether the counter is disabled. Default: false
   */
  disabled?: boolean;
  /**
   * Custom accent color (e.g. '#0cdcf7', '#9911ff').
   */
  accentColor?: string;
  /**
   * Custom class name for outer wrapper.
   */
  className?: string;
  /**
   * Inline style object.
   */
  style?: React.CSSProperties;
}

interface AdditionIconProps {
  type: 'plus' | 'minus';
  className?: string;
}

const AdditionIcon: React.FC<AdditionIconProps> = ({ type, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${styles.icon} ${className}`}
  >
    <path d="M5 12h14" />
    {type === 'plus' && <path d="M12 5v14" />}
  </svg>
);

export const NumberCounter: React.FC<NumberCounterProps> = ({
  min = -Infinity,
  max = Infinity,
  step = 1,
  defaultValue = 0,
  value: controlledValue,
  onChange,
  disabled = false,
  accentColor,
  className = '',
  style,
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<number>(defaultValue);
  const activeValue = isControlled ? controlledValue : internalValue;

  const handlePointerDown = (delta: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    const nextVal = Math.min(Math.max(activeValue + delta * step, min), max);
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal);
  };

  const handleKeyDown = (delta: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (disabled) return;
      const nextVal = Math.min(Math.max(activeValue + delta * step, min), max);
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      onChange?.(nextVal);
    }
  };

  const accentHex = accentColor || '#0cdcf7';
  // Compute semi-transparent background and solid focus ring from accent
  const dynamicStyles = accentColor
    ? ({
        '--counter-button-bg': `${accentColor}33`,
        '--counter-accent-solid': accentColor,
      } as React.CSSProperties)
    : undefined;

  const buttonMotionProps: MotionProps = {
    initial: {
      boxShadow: `0px 0px 0px 2px ${accentHex}00`,
    },
    whileHover: disabled ? undefined : {
      scale: 1.1,
    },
    whileTap: disabled ? undefined : {
      scale: 0.9,
    },
    whileFocus: disabled ? undefined : {
      boxShadow: `0px 0px 0px 2px ${accentHex}ff`,
    },
    layout: true,
  };

  const isMinusDisabled = disabled || (min != null && activeValue <= min);
  const isPlusDisabled = disabled || (max != null && activeValue >= max);

  return (
    <div className={`${styles.wrapper} ${className}`} style={{ ...dynamicStyles, ...style }}>
      <LayoutGroup id="number-counter-group">
        <motion.div layout className={styles.container}>
          <motion.button
            type="button"
            className={styles.button}
            disabled={isMinusDisabled}
            onPointerDown={handlePointerDown(-1)}
            onKeyDown={handleKeyDown(-1)}
            aria-label="Decrement value"
            {...buttonMotionProps}
          >
            <AdditionIcon type="minus" />
          </motion.button>

          <AnimateNumber
            className={styles.number}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
          >
            {activeValue}
          </AnimateNumber>

          <motion.button
            type="button"
            className={styles.button}
            disabled={isPlusDisabled}
            onPointerDown={handlePointerDown(1)}
            onKeyDown={handleKeyDown(1)}
            aria-label="Increment value"
            {...buttonMotionProps}
          >
            <AdditionIcon type="plus" />
          </motion.button>
        </motion.div>
      </LayoutGroup>
    </div>
  );
};

export default NumberCounter;
