'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SmoothTabs.module.scss';

export interface TabItem {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  stats: { label: string; value: string }[];
}

export interface SmoothTabsProps {
  /**
   * Spring physics for active tab indicator layout transition.
   * Default: { stiffness: 500, damping: 35 }
   */
  indicatorSpring?: { stiffness: number; damping: number };
  /**
   * Horizontal offset distance in pixels for content slide in/out.
   * Default: 50
   */
  contentOffsetX?: number;
  /**
   * Transition duration for content change animation.
   * Default: 0.3
   */
  contentDuration?: number;
  /**
   * Custom tabs list. If omitted, uses authentic Motion.dev project tabs.
   */
  tabs?: TabItem[];
  /**
   * Active tab index for controlled mode.
   */
  activeIndex?: number;
  /**
   * Initial active tab index for uncontrolled mode.
   */
  defaultIndex?: number;
  /**
   * Callback fired when active tab changes.
   */
  onChange?: (index: number) => void;
  /**
   * Custom CSS class name for container.
   */
  className?: string;
  /**
   * Inline styles for container.
   */
  style?: React.CSSProperties;
}

/** ==============   Icons matching Motion.dev   ================ */

export const OverviewIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="2" fill="currentColor" />
    <rect x="10" y="1" width="7" height="7" rx="2" fill="currentColor" opacity={0.5} />
    <rect x="1" y="10" width="7" height="7" rx="2" fill="currentColor" opacity={0.5} />
    <rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" opacity={0.3} />
  </svg>
);

export const ActivityIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M1 9h3l2-5 3 10 2-7h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SettingsIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9 1v2M9 15v2M1 9h2M15 9h2M3.3 3.3l1.4 1.4M13.3 13.3l1.4 1.4M14.7 3.3l-1.4 1.4M4.7 13.3l-1.4 1.4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** ==============   Default Motion.dev Tabs Data   ================ */

export const DEFAULT_TABS: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    color: 'var(--hue-3)',
    icon: <OverviewIcon />,
    description: 'Track your project progress across all active workstreams and milestones.',
    stats: [
      { label: 'Active', value: '12' },
      { label: 'Complete', value: '84' },
      { label: 'Velocity', value: '94%' },
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    color: 'var(--hue-1)',
    icon: <ActivityIcon />,
    description: 'Recent changes, commits, and team updates from the last 7 days.',
    stats: [
      { label: 'Commits', value: '47' },
      { label: 'Reviews', value: '23' },
      { label: 'Merged', value: '18' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    color: 'var(--hue-5)',
    icon: <SettingsIcon />,
    description: 'Configure notifications, access controls, and integration preferences.',
    stats: [
      { label: 'Members', value: '8' },
      { label: 'Roles', value: '3' },
      { label: 'Hooks', value: '5' },
    ],
  },
];

export const SmoothTabs: React.FC<SmoothTabsProps> = ({
  indicatorSpring = { stiffness: 500, damping: 35 },
  contentOffsetX = 50,
  contentDuration = 0.3,
  tabs = DEFAULT_TABS,
  activeIndex: controlledIndex,
  defaultIndex = 0,
  onChange,
  className = '',
  style,
}) => {
  const isControlled = controlledIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const [direction, setDirection] = useState(0);

  const activeIndex = isControlled ? controlledIndex : internalIndex;
  const activeTab = tabs[activeIndex] || tabs[0];

  const handleTabChange = (index: number) => {
    if (index === activeIndex) return;
    setDirection(index > activeIndex ? 1 : -1);
    if (!isControlled) {
      setInternalIndex(index);
    }
    onChange?.(index);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir * contentOffsetX,
      opacity: 0,
      filter: 'blur(4px)',
    }),
    active: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (dir: number) => ({
      x: dir * -contentOffsetX,
      opacity: 0,
      filter: 'blur(4px)',
      transition: { duration: contentDuration * 0.5 },
    }),
  };

  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <div className={styles.card}>
        <div className={styles.segmentedControl}>
          {tabs.map((tab, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabButton} ${isActive ? `${styles.active} active` : ''}`}
                onClick={() => handleTabChange(index)}
                style={{
                  color: isActive ? 'var(--black)' : 'var(--feint-text)',
                }}
                aria-selected={isActive}
                role="tab"
              >
                <span className={styles.tabLabel}>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="smooth-tab-indicator"
                    className={styles.indicator}
                    transition={{
                      type: 'spring',
                      ...indicatorSpring,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.contentContainer}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={activeTab.id}
              variants={variants}
              initial="enter"
              animate="active"
              exit="exit"
              custom={direction}
              transition={{
                duration: contentDuration,
                ease: [0.25, 1, 0.5, 1],
              }}
              className={styles.content}
            >
              <div className={styles.contentHeader}>
                <div
                  className={styles.icon}
                  style={{
                    backgroundColor: activeTab.color,
                  }}
                >
                  {activeTab.icon}
                </div>
                <h3 className={styles.title}>{activeTab.label}</h3>
              </div>

              <p className={styles.description}>{activeTab.description}</p>

              <div className={styles.statsRow}>
                {activeTab.stats.map((stat) => (
                  <div key={stat.label} className={styles.stat}>
                    <span className={styles.statValue}>{stat.value}</span>
                    <span className={styles.statLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SmoothTabs;
