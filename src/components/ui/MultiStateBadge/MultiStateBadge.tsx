'use client';

import React, { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import {
  motion,
  AnimatePresence,
  useTime,
  useTransform,
  animate,
  type Transition,
} from 'framer-motion';
import styles from './MultiStateBadge.module.scss';

export type MultiStateBadgeState = 'idle' | 'processing' | 'success' | 'error';

export interface MultiStateBadgeLabels {
  idle?: string;
  processing?: string;
  success?: string;
  error?: string;
}

export interface MultiStateBadgeProps {
  /**
   * Current active state of the badge.
   * If not provided, badge manages its own state and cycles on click.
   */
  state?: MultiStateBadgeState;
  /**
   * Callback fired when badge state changes or is clicked.
   */
  onStateChange?: (state: MultiStateBadgeState) => void;
  /**
   * Whether clicking the badge cycles to the next state.
   * Defaults to true.
   */
  interactive?: boolean;
  /**
   * Optional custom label overrides for each state.
   */
  labels?: MultiStateBadgeLabels;
  /**
   * Custom className for the outer container.
   */
  className?: string;
  /**
   * Custom style for the outer container.
   */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: Record<MultiStateBadgeState, string> = {
  idle: 'Start',
  processing: 'Processing',
  success: 'Done',
  error: 'Something went wrong',
};

const STATE_ORDER: MultiStateBadgeState[] = ['idle', 'processing', 'success', 'error'];

// Exact Motion.dev spring transition
const springTransition: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 30,
};

// Exact Motion.dev path drawing spring
const pathSpring: Transition = {
  type: 'spring',
  stiffness: 150,
  damping: 20,
};

const pathAnimation = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: pathSpring,
};

const delayedPathAnimation = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { ...pathSpring, delay: 0.1 },
};

const commonSvgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Success checkmark icon (Motion.dev exact polyline)
const SuccessIcon = () => (
  <motion.svg {...commonSvgProps}>
    <motion.polyline points="4 12 9 17 20 6" {...pathAnimation} />
  </motion.svg>
);

// Processing spinner icon with continuous rotation and animated arc (Motion.dev exact)
const ProcessingIcon = () => {
  const time = useTime();
  const rotate = useTransform(time, [0, 1000], [0, 360], { clamp: false });

  return (
    <motion.div
      style={{
        rotate,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
      }}
    >
      <motion.svg {...commonSvgProps}>
        <motion.path
          d="M21 12a9 9 0 1 1-6.219-8.56"
          {...pathAnimation}
        />
      </motion.svg>
    </motion.div>
  );
};

// Error cross icon with animated two-line drawing (Motion.dev exact)
const ErrorIcon = () => (
  <motion.svg {...commonSvgProps}>
    <motion.line x1="6" y1="6" x2="18" y2="18" {...pathAnimation} />
    <motion.line x1="18" y1="6" x2="6" y2="18" {...delayedPathAnimation} />
  </motion.svg>
);

// State icon renderer with slide, blur & scale transitions (Motion.dev exact)
const BadgeIcon = ({ state }: { state: MultiStateBadgeState }) => {
  let iconContent: React.ReactNode = <Fragment />;
  switch (state) {
    case 'idle':
      iconContent = <Fragment />;
      break;
    case 'processing':
      iconContent = <ProcessingIcon />;
      break;
    case 'success':
      iconContent = <SuccessIcon />;
      break;
    case 'error':
      iconContent = <ErrorIcon />;
      break;
  }

  return (
    <motion.span
      className={styles.iconContainer}
      animate={{ width: state === 'idle' ? 0 : 20 }}
      transition={springTransition}
    >
      <AnimatePresence>
        <motion.span
          key={state}
          className={styles.icon}
          initial={{ y: -40, scale: 0.5, filter: 'blur(6px)' }}
          animate={{ y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: 40, scale: 0.5, filter: 'blur(6px)' }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        >
          {iconContent}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
};

// Animated text label with measured width and smooth blur morph (Motion.dev exact)
const BadgeLabel = ({
  state,
  currentText,
}: {
  state: MultiStateBadgeState;
  currentText: string;
}) => {
  const [width, setWidth] = useState<number>(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measureRef.current) {
      const rect = measureRef.current.getBoundingClientRect();
      setWidth(rect.width);
    }
  }, [currentText]);

  return (
    <>
      <div ref={measureRef} className={styles.textMeasure}>
        {currentText}
      </div>
      <motion.span
        layout
        className={styles.textContainer}
        animate={{ width }}
        transition={springTransition}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={state}
            className={styles.textItem}
            initial={{ y: -20, opacity: 0, filter: 'blur(10px)', position: 'absolute' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)', position: 'relative' }}
            exit={{ y: 20, opacity: 0, filter: 'blur(10px)', position: 'absolute' }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {currentText}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    </>
  );
};

// Inner Badge Component with shake / bounce trigger effects (Motion.dev exact)
const BadgePill = ({
  state,
  currentText,
}: {
  state: MultiStateBadgeState;
  currentText: string;
}) => {
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!badgeRef.current) return;
    if (state === 'error') {
      animate(
        badgeRef.current,
        { x: [0, -6, 6, -6, 0] },
        {
          duration: 0.3,
          ease: 'easeInOut',
          times: [0, 0.25, 0.5, 0.75, 1],
          repeat: 0,
          delay: 0.1,
        }
      );
    } else if (state === 'success') {
      animate(
        badgeRef.current,
        { scale: [1, 1.2, 1] },
        {
          duration: 0.3,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
          repeat: 0,
        }
      );
    }
  }, [state]);

  return (
    <motion.div
      ref={badgeRef}
      className={styles.badge}
      style={{ gap: state === 'idle' ? 0 : 8 }}
      transition={springTransition}
    >
      <BadgeIcon state={state} />
      <BadgeLabel state={state} currentText={currentText} />
    </motion.div>
  );
};

export const MultiStateBadge: React.FC<MultiStateBadgeProps> = ({
  state: controlledState,
  onStateChange,
  interactive = true,
  labels: customLabels,
  className,
  style,
}) => {
  const [internalState, setInternalState] = useState<MultiStateBadgeState>('idle');
  const currentState = controlledState !== undefined ? controlledState : internalState;

  const mergedLabels: Record<MultiStateBadgeState, string> = useMemo(
    () => ({
      ...DEFAULT_LABELS,
      ...customLabels,
    }),
    [customLabels]
  );

  const getNextState = (current: MultiStateBadgeState): MultiStateBadgeState => {
    const currentIndex = STATE_ORDER.indexOf(current);
    const nextIndex = (currentIndex + 1) % STATE_ORDER.length;
    return STATE_ORDER[nextIndex];
  };

  const handleClick = () => {
    if (!interactive) return;
    const next = getNextState(currentState);
    if (controlledState === undefined) {
      setInternalState(next);
    }
    onStateChange?.(next);
  };

  return (
    <div className={`${styles.container} ${className || ''}`} style={style}>
      <button
        type="button"
        className={styles.badgeButton}
        onClick={handleClick}
        disabled={!interactive}
        aria-label={`Current status: ${mergedLabels[currentState]}. Click to cycle status.`}
      >
        <BadgePill state={currentState} currentText={mergedLabels[currentState]} />
      </button>
    </div>
  );
};

export default MultiStateBadge;
