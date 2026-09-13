'use client';

import React, { useEffect, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useMotionValue, useVelocity, useSpring, SpringOptions } from 'framer-motion';
import { AnimateNumber } from '@/components/ui/LineGraph/AnimateNumber';
import styles from './RadixSlider.module.scss';

export interface RadixSliderProps {
  /**
   * Minimum slider value. Default: 0
   */
  min?: number;
  /**
   * Maximum slider value. Default: 100
   */
  max?: number;
  /**
   * Step increment. Default: 1
   */
  step?: number;
  /**
   * Initial default value for uncontrolled mode. Default: [50]
   */
  defaultValue?: number[];
  /**
   * Current controlled value.
   */
  value?: number[];
  /**
   * Callback fired when value changes during sliding.
   */
  onValueChange?: (value: number[]) => void;
  /**
   * Callback fired when sliding ends or value is committed.
   */
  onValueCommit?: (value: number[]) => void;
  /**
   * Whether slider is disabled. Default: false
   */
  disabled?: boolean;
  /**
   * Sensitivity factor for pendulum tilt angle based on velocity.
   * Default: -0.1 (matches Motion.dev physics)
   */
  tiltSensitivity?: number;
  /**
   * Custom spring physics options for the tilt rotation.
   */
  tiltSpring?: SpringOptions;
  /**
   * Custom accent color (e.g. hex, hsl, or CSS variable like 'var(--hue-3)').
   */
  accentColor?: string;
  /**
   * Custom label for accessibility.
   */
  ariaLabel?: string;
  /**
   * Additional CSS class name for the wrapper.
   */
  className?: string;
  /**
   * Inline style object for the wrapper.
   */
  style?: React.CSSProperties;
}

function calculateTiltTarget(val: number, sensitivity: number = -0.1): number {
  return val * sensitivity;
}

export const RadixSlider: React.FC<RadixSliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = [50],
  value: controlledValue,
  onValueChange,
  onValueCommit,
  disabled = false,
  tiltSensitivity = -0.1,
  tiltSpring,
  accentColor,
  ariaLabel = 'Volume',
  className = '',
  style,
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<number[]>(defaultValue);

  const currentValue = isControlled ? controlledValue : internalValue;
  const activeNumber = currentValue[0] ?? min;

  // Velocity-driven rotation physics (Motion.dev authentic formula)
  const motionVal = useMotionValue(calculateTiltTarget(activeNumber, tiltSensitivity));
  const velocity = useVelocity(motionVal);
  const rotateSpring = useSpring(velocity, tiltSpring);

  useEffect(() => {
    motionVal.set(calculateTiltTarget(activeNumber, tiltSensitivity));
  }, [activeNumber, motionVal, tiltSensitivity]);

  const handleValueChange = (nextVals: number[]) => {
    if (!isControlled) {
      setInternalValue(nextVals);
    }
    onValueChange?.(nextVals);
  };

  const dynamicStyles = accentColor
    ? ({
        '--slider-accent': accentColor,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className={`${styles.wrapper} ${className}`} style={{ ...dynamicStyles, ...style }}>
      <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
        <Slider.Root
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue}
          value={isControlled ? controlledValue : undefined}
          onValueChange={handleValueChange}
          onValueCommit={onValueCommit}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          <Slider.Track className={styles.track}>
            <Slider.Range className={styles.range} />
          </Slider.Track>
          <Slider.Thumb className={styles.thumb} aria-label={ariaLabel}>
            <div className={styles.thumbTextContainer}>
              <AnimateNumber
                transition={{ duration: 0.2, ease: 'easeOut' }}
                locales="en-US"
                className={styles.thumbText}
                style={{
                  originX: 0.5,
                  originY: 1.5,
                  rotate: rotateSpring,
                }}
              >
                {activeNumber}
              </AnimateNumber>
            </div>
          </Slider.Thumb>
        </Slider.Root>
      </form>
    </div>
  );
};

export default RadixSlider;
