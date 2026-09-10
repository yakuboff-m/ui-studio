'use client';

import React, { useState, useId } from 'react';
import { motion, Transition, Variants } from 'framer-motion';
import styles from './NotificationStack.module.scss';

export interface NotificationItem {
  id?: string;
  kind: 'funnel' | 'replay' | 'retention' | 'spike' | 'cohort' | string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  icon?: React.ReactNode;
}

export interface NotificationStackProps {
  /** Number of notifications to display in the stack (1 to notifications.length) */
  count?: number;
  /** Width of each card in pixels */
  cardWidth?: number;
  /** Height of each card in pixels */
  cardHeight?: number;
  /** Vertical gap between expanded cards in pixels */
  cardGap?: number;
  /** Scale reduction factor per stacked layer when collapsed */
  scaleStep?: number;
  /** Opacity dimming factor per stacked layer when collapsed */
  dimStep?: number;
  /** Theme styling: 'light' (Motion UI default), 'dark', or 'auto' */
  theme?: 'light' | 'dark' | 'auto';
  /** Custom notification data list */
  notifications?: NotificationItem[];
  /** Controlled open/expanded state */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Callback fired when the stack expands or collapses */
  onOpenChange?: (open: boolean) => void;
  /** Section title displayed in expanded header */
  title?: string;
  /** Label for collapse button */
  collapseLabel?: string;
  /** Render in ambient warm peach/cream glow backdrop frame (as seen in Motion UI) */
  ambient?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    kind: 'funnel',
    title: 'Checkout funnel is leaking',
    body: 'Trial to payment dropped 6% this week, 214 sessions lost.',
    time: '6m',
    unread: true,
  },
  {
    id: '2',
    kind: 'replay',
    title: 'Priya flagged a rage-click',
    body: 'Three users hit the same dead button on Pricing.',
    time: '22m',
    unread: true,
  },
  {
    id: '3',
    kind: 'retention',
    title: 'Weekly retention snapshot ready',
    body: 'Week four holds at 68%, up three points on last month.',
    time: '1h',
    unread: true,
  },
  {
    id: '4',
    kind: 'spike',
    title: 'Traffic is spiking on Pricing',
    body: 'Live visitors are 2.3x your Tuesday baseline.',
    time: '3h',
    unread: true,
  },
  {
    id: '5',
    kind: 'cohort',
    title: 'March cohort finished onboarding',
    body: '82% reached their first insight within a day.',
    time: '1d',
    unread: true,
  },
];

/* ── 1:1 Motion UI SVGs ── */
function NotificationIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'funnel':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
      );
    case 'replay':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m10 9 5 3-5 3V9Z" />
        </svg>
      );
    case 'retention':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
          <path d="M16 7h6v6" />
        </svg>
      );
    case 'spike':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'cohort':
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
          <circle cx="9.5" cy="7" r="4" />
          <path d="M22 21v-1a4 4 0 0 0-3-3.87" />
          <path d="M16.5 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      );
  }
}

function CollapseChevron() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

/* ── Motion UI Transition Physics ── */
const EASE_QUINT = [0.22, 1, 0.36, 1] as const;

const cardTransition = (delay = 0): Transition => ({
  y: {
    type: 'spring',
    stiffness: 304.62,
    damping: 33.16,
    mass: 1,
    delay,
  },
  scale: {
    type: 'spring',
    stiffness: 304.62,
    damping: 33.16,
    mass: 1,
    delay,
  },
  opacity: {
    type: 'tween',
    duration: 0.28,
    ease: EASE_QUINT,
    delay,
  },
});

const containerTransition: Transition = {
  y: {
    type: 'spring',
    stiffness: 304.62,
    damping: 33.16,
    mass: 1,
  },
};

const headerTransition = (delay = 0): Transition => ({
  y: {
    type: 'spring',
    stiffness: 304.62,
    damping: 33.16,
    mass: 1,
    delay,
  },
  scale: {
    type: 'spring',
    stiffness: 304.62,
    damping: 33.16,
    mass: 1,
    delay,
  },
  opacity: {
    type: 'tween',
    duration: 0.24,
    ease: EASE_QUINT,
    delay,
  },
});

const STAGGER_TIGHT = 0.04;
const STAGGER_RELAXED = 0.15;

export const NotificationStack: React.FC<NotificationStackProps> = ({
  count = 3,
  cardWidth = 350,
  cardHeight = 84,
  cardGap = 10,
  scaleStep = 0.08,
  dimStep = 0.4,
  theme = 'auto',
  notifications = DEFAULT_NOTIFICATIONS,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  title = 'Notifications',
  collapseLabel = 'Collapse',
  ambient = true,
  className = '',
  style,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const id = useId();

  const handleOpen = () => {
    if (!isControlled) {
      setUncontrolledOpen(true);
    }
    onOpenChange?.(true);
  };

  const handleClose = () => {
    if (!isControlled) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  };

  // Active notifications to render
  const visibleItems = notifications.slice(0, Math.max(0, count));
  const activeCount = visibleItems.length;

  // Geometry calculations matching Motion UI 1:1
  const g = cardHeight + cardGap * 2;
  const w = ((activeCount - 1) * g) / 2;
  const status = isOpen ? 'open' : 'closed';

  // Container translateY to center the collapsed stack
  const containerVariants: Variants = {
    closed: {
      y: w,
    },
    open: {
      y: 0,
    },
  };

  // Card transform & opacity calculation
  const cardVariants: Variants = {
    closed: (index: number) => ({
      y: -index * g,
      scale: Math.max(0.5, 1 - index * scaleStep),
      opacity: Math.max(0, 1 - index * dimStep),
    }),
    open: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
  };

  // Header entrance / exit
  const headerVariants: Variants = {
    closed: {
      y: cardHeight,
      scale: 0.85,
      opacity: 0,
    },
    open: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
  };

  const totalHeight = activeCount * cardHeight + Math.max(0, activeCount - 1) * cardGap;
  const dataThemeAttr = theme === 'auto' ? undefined : theme;

  return (
    <div
      className={`${styles.container} ${ambient ? styles.ambientWrap : ''} ${className}`}
      data-theme={dataThemeAttr}
      style={style}
    >
      <div
        className={styles.stackBox}
        style={{
          width: cardWidth,
          height: totalHeight,
        }}
      >
        {/* Header (visible when expanded) */}
        <motion.div
          className={styles.header}
          variants={headerVariants}
          initial={false}
          animate={status}
          transition={headerTransition(isOpen ? STAGGER_RELAXED : 0)}
          aria-hidden={!isOpen}
        >
          <h2 className={styles.headerTitle}>{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            tabIndex={isOpen ? 0 : -1}
            aria-expanded={isOpen}
            aria-controls={id}
            className={styles.collapseButton}
          >
            <CollapseChevron />
            {collapseLabel}
          </button>
        </motion.div>

        {/* Stacked Cards */}
        <motion.ul
          id={id}
          className={styles.list}
          variants={containerVariants}
          initial={false}
          animate={status}
          transition={containerTransition}
        >
          {visibleItems.map((item, index) => {
            const delay = index * STAGGER_TIGHT;

            return (
              <motion.li
                key={item.id || item.kind || index}
                custom={index}
                variants={cardVariants}
                initial={false}
                animate={status}
                transition={cardTransition(delay)}
                className={styles.listItem}
                style={{
                  top: index * (cardHeight + cardGap),
                  height: cardHeight,
                  zIndex: activeCount - index,
                }}
              >
                <div className={styles.card}>
                  <span className={styles.iconBox}>
                    {item.icon || <NotificationIcon kind={item.kind} />}
                  </span>

                  <div className={styles.contentBox}>
                    <p className={styles.cardTitle}>{item.title}</p>
                    <p className={styles.cardBody}>{item.body}</p>
                  </div>

                  <div className={styles.trailingBox}>
                    <span className={styles.timeText}>{item.time}</span>
                    {item.unread !== false && (
                      <span className={styles.unreadDot} aria-hidden="true" />
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Click overlay trigger to expand when collapsed */}
        {!isOpen && (
          <button
            type="button"
            onClick={handleOpen}
            aria-label={`Show all ${activeCount} notifications`}
            aria-expanded={false}
            aria-controls={id}
            className={styles.expandTrigger}
          />
        )}

        {/* Screen reader announcement */}
        <span aria-live="polite" className={styles.srOnly}>
          {isOpen ? `Notifications expanded, ${activeCount} shown` : 'Notifications collapsed'}
        </span>
      </div>
    </div>
  );
};

// Aliases for 1:1 compatibility with Motion UI and naming conventions
export const ListNotificationsStack = NotificationStack;
export default NotificationStack;
