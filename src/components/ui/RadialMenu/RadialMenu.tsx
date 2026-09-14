'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import styles from './RadialMenu.module.scss';

export interface RadialMenuItem {
  label: string;
  bg: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface RadialMenuProps {
  /**
   * Radial distance (in pixels) from the central trigger button.
   * Default: 70
   */
  radius?: number;
  /**
   * Spring transition config for items and trigger.
   */
  itemSpring?: Transition;
  /**
   * Spring stiffness when custom spring is not provided.
   * Default: 420
   */
  stiffness?: number;
  /**
   * Spring damping when custom spring is not provided.
   * Default: 24
   */
  damping?: number;
  /**
   * Stagger delay between sequential items in seconds.
   * Default: 0.04
   */
  staggerInterval?: number;
  /**
   * Starting angle in degrees for the arc layout.
   * Default: -150
   */
  startAngle?: number;
  /**
   * Total angular span in degrees for the radial fan-out.
   * Default: 300
   */
  arcSpan?: number;
  /**
   * Array of radial menu items.
   */
  items?: RadialMenuItem[];
  /**
   * Controlled open state.
   */
  isOpen?: boolean;
  /**
   * Default open state for uncontrolled mode.
   * Default: false
   */
  defaultOpen?: boolean;
  /**
   * Callback fired when open state changes.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Callback fired when any item is clicked.
   */
  onItemClick?: (item: RadialMenuItem, index: number) => void;
  /**
   * Whether to display hover label tooltips.
   * Default: true
   */
  showTooltips?: boolean;
  /**
   * Whether the radial menu trigger is disabled.
   * Default: false
   */
  disabled?: boolean;
  /**
   * Custom accent color for trigger or focus rings.
   */
  accentColor?: string;
  /**
   * Custom CSS class name for the container.
   */
  className?: string;
  /**
   * Custom inline style object for the container.
   */
  style?: React.CSSProperties;
}

/** Authentic Motion.dev SVG Icons */
export const DEFAULT_RADIAL_ITEMS: RadialMenuItem[] = [
  {
    label: 'Search',
    bg: '#8b5cf6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Home',
    bg: '#3b82f6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Heart',
    bg: '#ec4899',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Star',
    bg: '#f59e0b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: 'Share',
    bg: '#10b981',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    bg: '#6366f1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const closedState = { opacity: 0, scale: 0, x: 0, y: 0 };

export function RadialMenu({
  radius = 70,
  itemSpring,
  stiffness = 420,
  damping = 24,
  staggerInterval = 0.04,
  startAngle = -150,
  arcSpan = 300,
  items = DEFAULT_RADIAL_ITEMS,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  onItemClick,
  showTooltips = true,
  disabled = false,
  accentColor,
  className = '',
  style,
}: RadialMenuProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const springConfig: Transition = itemSpring ?? {
    type: 'spring',
    stiffness,
    damping,
  };

  const setOpen = (nextOpen: boolean) => {
    if (disabled) return;
    if (!isControlled) {
      setUncontrolledIsOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
    }
  };

  return (
    <div
      className={`${styles.container} ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.menuContainer} role="region" aria-label="Radial Menu">
        <AnimatePresence>
          {open &&
            items.map((item, i) => {
              const divisor = items.length > 1 ? items.length - 1 : 1;
              const angle = startAngle + (i / divisor) * arcSpan;
              const radian = (angle * Math.PI) / 180;
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;

              return (
                <motion.div
                  key={item.label}
                  initial={closedState}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x,
                    y,
                  }}
                  exit={closedState}
                  transition={{
                    ...springConfig,
                    delay: i * staggerInterval,
                  }}
                  className={styles.itemWrapper}
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={styles.itemButton}
                    style={{ backgroundColor: item.bg }}
                    aria-label={item.label}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(i)}
                    onBlur={() => setHoveredIndex(null)}
                    onClick={() => {
                      item.onClick?.();
                      onItemClick?.(item, i);
                    }}
                  >
                    {item.icon}
                  </motion.button>
                  {showTooltips && hoveredIndex === i && (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={styles.itemTooltip}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>

        <motion.button
          type="button"
          className={styles.trigger}
          style={
            accentColor
              ? {
                  borderColor: accentColor,
                  color: accentColor,
                }
              : undefined
          }
          onClick={() => setOpen(!open)}
          animate={{ rotate: open ? 45 : 0 }}
          whileHover={disabled ? undefined : { scale: 1.05 }}
          whileTap={disabled ? undefined : { scale: 0.92 }}
          transition={springConfig}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          disabled={disabled}
          data-primary-action
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

export default RadialMenu;
