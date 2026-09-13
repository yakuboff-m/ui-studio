'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  MotionConfig,
} from 'framer-motion';
import styles from './LineGraph.module.scss';
import AnimateNumber from './AnimateNumber';

export interface LineGraphProps {
  /**
   * Array of numeric values to plot.
   * Defaults to exact Motion.dev sample dataset: [30, 8, 36, 29, 50, 78]
   */
  data?: number[];
  /**
   * Optional color override for positive trend and line stroke.
   */
  positiveColor?: string;
  /**
   * Optional color override for negative trend.
   */
  negativeColor?: string;
  /**
   * Whether to display the spring cursor follower tooltip on hover. Defaults to true.
   */
  showTooltip?: boolean;
  /**
   * Custom className for outer wrapper.
   */
  className?: string;
  /**
   * Custom style for outer wrapper.
   */
  style?: React.CSSProperties;
}

const DEFAULT_DATA = [30, 8, 36, 29, 50, 78];
const GRID_LINES = [50, 100, 150, 200, 250];

// Reducer function to construct SVG path string (exact Motion.dev implementation)
function reducePath(acc: string, pt: { x: number; y: number }, index: number): string {
  return index === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
}

export const LineGraph: React.FC<LineGraphProps> = ({
  data = DEFAULT_DATA,
  positiveColor,
  negativeColor,
  showTooltip = true,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);

  // Exact spring dynamics from Motion.dev Cursor followSpring: { stiffness: 1000, damping: 100 }
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 1000, damping: 100 });
  const springY = useSpring(mouseY, { stiffness: 1000, damping: 100 });

  // Map data points into 600x300 SVG coordinate space (x = 50 + i * 100, y = 250 - val * 2)
  const points = useMemo(() => {
    const count = data.length;
    const step = count > 1 ? 500 / (count - 1) : 100;
    return data.map((val, i) => ({
      x: 50 + i * step,
      y: 250 - val * 2,
      value: val,
    }));
  }, [data]);

  // Construct path definitions
  const pathString = useMemo(() => points.reduce(reducePath, ''), [points]);
  const areaPathString = useMemo(() => {
    if (!points.length) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${pathString} L ${lastX},250 L ${firstX},250 Z`;
  }, [pathString, points]);

  // Hitbox column width
  const colWidth = useMemo(() => {
    return data.length > 1 ? 500 / (data.length - 1) : 100;
  }, [data.length]);

  // Track pointer movements for tooltip
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left + 20;
      const localY = e.clientY - rect.top + 20;
      mouseX.set(localX);
      mouseY.set(localY);
    },
    [mouseX, mouseY]
  );

  // Handle hovering over specific point column (exact Motion.dev formula)
  const handlePointHover = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (index > 0) {
        const curr = data[index];
        const prev = data[index - 1];
        const percentage = ((curr - prev) / prev) * 100;
        setDelta(percentage);
      } else {
        setDelta(null);
      }
    },
    [data]
  );

  // Reset on leave (exact Motion.dev onPointerLeave handler)
  const handlePointerLeave = useCallback(() => {
    setActiveIndex(null);
    setDelta(null);
  }, []);

  // Format delta display (compact with short notation, e.g. 73% or 350%)
  const formattedDelta = useMemo(() => {
    if (delta === null) return '';
    const abs = Math.abs(delta);
    return abs >= 100 ? Math.round(abs).toString() : abs.toFixed(1).replace(/\.0$/, '');
  }, [delta]);

  const customStyle = useMemo(() => {
    const base: Record<string, string | number> = { ...style };
    if (positiveColor) base['--hue-6'] = positiveColor;
    if (negativeColor) base['--hue-1'] = negativeColor;
    return base as React.CSSProperties;
  }, [positiveColor, negativeColor, style]);

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${className || ''}`}
      style={customStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <svg
        width="600"
        height="300"
        viewBox="0 0 600 300"
        className={styles.graphSvg}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--hue-6)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--hue-6)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dashed Grid Lines (y: 50, 100, 150, 200, 250) */}
        {GRID_LINES.map((y) => (
          <motion.line
            key={y}
            x1="50"
            y1={y}
            x2="550"
            y2={y}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}

        {/* Gradient Area Fill */}
        <motion.path
          d={areaPathString}
          fill="url(#areaGradient)"
        />

        {/* Main Line Stroke with 1.5s easeInOut draw animation */}
        <motion.path
          d={pathString}
          fill="none"
          stroke="var(--hue-6)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Interactive Hit-Zones and Staggered Points */}
        <g>
          {points.map((pt, i) => (
            <g key={i}>
              {/* Invisible wide column for hover target */}
              <rect
                x={pt.x - colWidth / 2}
                y={0}
                width={colWidth}
                height={300}
                fill="transparent"
                className={styles.pointHitbox}
                onPointerEnter={() => handlePointHover(i)}
                onFocus={() => handlePointHover(i)}
                tabIndex={0}
                aria-label={`Point ${i + 1}: ${pt.value}`}
              />

              {/* Point Circle (scales to 1.5x on hover with spring) */}
              <motion.circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="var(--layer)"
                stroke="var(--hue-6)"
                strokeWidth="1"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: activeIndex === i ? 1.5 : 1,
                  opacity: 1,
                }}
                transition={{
                  scale: { type: 'spring', stiffness: 350, damping: 25 },
                  opacity: { duration: 0.3, delay: 0.1 + i * (1.5 / Math.max(points.length, 1)) },
                }}
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Floating Spring Cursor Follower Tooltip */}
      {showTooltip && (
        <AnimatePresence>
          {delta !== null && (
            <motion.div
              key="cursor"
              className={styles.tooltip}
              style={{
                x: springX,
                y: springY,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <MotionConfig transition={{ type: 'spring', visualDuration: 0.6, bounce: 0.2 }}>
                {/* Arrow indicator with spring rotation */}
                <motion.div
                  className={styles.arrow}
                  animate={{
                    rotate: delta < 0 ? 180 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  style={{
                    color: delta < 0 ? 'var(--hue-1)' : 'var(--hue-6)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  ↑
                </motion.div>

                {/* Animated Number percentage delta with odometer ticker reel */}
                <AnimateNumber
                  className={styles.numberValue}
                  format={{ notation: 'compact', compactDisplay: 'short' }}
                  suffix="%"
                  style={{
                    color: delta < 0 ? 'var(--hue-1)' : 'var(--hue-6)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {delta}
                </AnimateNumber>
              </MotionConfig>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default LineGraph;
