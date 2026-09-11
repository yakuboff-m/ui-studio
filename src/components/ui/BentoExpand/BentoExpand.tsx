'use client';

import React, { useState, useId } from 'react';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
} from 'framer-motion';
import styles from './BentoExpand.module.scss';

/* ── Types ── */
export interface BentoExpandExtra {
  /** Bold headline inside the modal (same as subtitle if omitted) */
  headline?: string;
  /** Long descriptive paragraph shown only in modal */
  body: string;
  /** Small highlight box label + note */
  highlight?: { label: string; note: string };
  /** Bullet checklist items shown at the bottom of the modal */
  bullets?: string[];
}

export interface BentoExpandItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  /** Short teaser shown on the card */
  subtitle: string;
  extra: BentoExpandExtra;
  /** 'full' = spans both columns (top card) | 'half' = single column */
  size?: 'full' | 'half';
}

export interface BentoExpandProps {
  heading?: string;
  subheading?: string;
  items?: BentoExpandItem[];
  theme?: 'auto' | 'dark' | 'light';
  style?: React.CSSProperties;
  className?: string;
}

/* ── Icons (inline SVG to avoid dependencies) ── */
const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2h4M2 2v4M2 2l5 5M8 2h4v4M12 8v4H8M12 12l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Default data ── */
const DEFAULT_ITEMS: BentoExpandItem[] = [
  {
    id: 'funnels',
    size: 'full',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
    title: 'Funnels',
    subtitle: 'Watch every step of a journey and see exactly where people drop off.',
    extra: {
      headline: 'Watch every step of a journey and see exactly where people drop off.',
      body: 'Build a funnel from any sequence of events and break down conversion, time to convert and the drop between each step. Filter by cohort, device or plan without writing a query, and mark the step that is quietly leaking the most sign-ups.',
      highlight: { label: 'Step 2', note: 'where most people leave onboarding' },
      bullets: [
        'Step-by-step conversion with confidence intervals',
        'Compare any two cohorts side by side',
        'Flag a step the moment it regresses past its baseline',
      ],
    },
  },
  {
    id: 'session-replay',
    size: 'half',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Session replay',
    subtitle: 'Replay the exact session behind any metric and jump straight to the friction.',
    extra: {
      headline: 'Replay the exact session behind any metric.',
      body: 'Jump from a funnel drop-off or retention graph directly into a full session recording. See every click, scroll and network request without any extra instrumentation.',
      highlight: { label: 'Rage click', note: 'detected on checkout button' },
      bullets: [
        'Filter sessions by any event or property',
        'Jump to the exact moment of friction',
        'Share timestamped clips with your team',
      ],
    },
  },
  {
    id: 'retention',
    size: 'half',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    title: 'Retention',
    subtitle: 'Cohort curves that show who comes back, and the feature that brought them.',
    extra: {
      headline: 'Cohort curves that show who comes back.',
      body: 'Track how many users return after their first event, broken down by the week they joined or the feature they used. Spot the behaviours that predict long-term retention before they become obvious.',
      highlight: { label: 'Week 4', note: 'highest drop-off point across all cohorts' },
      bullets: [
        'Rolling and fixed-window retention',
        'Break down by any user property',
        'Set retention targets and get alerted on regressions',
      ],
    },
  },
  {
    id: 'autocapture',
    size: 'half',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: 'Autocapture',
    subtitle: 'Every click, tap and pageview captured from day one, no tracking plan required.',
    extra: {
      headline: 'Every interaction captured from day one.',
      body: 'Ship and immediately see every button click, form submit and page view — no tracking plan required. Retroactively build events from already-captured data whenever you need them.',
      highlight: { label: '2.4 M', note: 'events captured in the last 24 hours' },
      bullets: [
        'Zero-config event capture out of the box',
        'Define events retroactively from raw data',
        'Combine autocapture with custom events',
      ],
    },
  },
  {
    id: 'live-cohorts',
    size: 'half',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Live cohorts',
    subtitle: 'Group users by behaviour and watch the segments update in real time.',
    extra: {
      headline: 'Group users by behaviour, updated in real time.',
      body: 'Define a cohort once — users who completed onboarding but never invited a teammate — and the list updates itself every time someone qualifies or drops out. Use it to trigger messages, limit features, or run experiments.',
      highlight: { label: '1,284', note: 'users matched this cohort right now' },
      bullets: [
        'Cohorts update automatically as data arrives',
        'Use cohorts in experiments and feature flags',
        'Export to any destination on a schedule',
      ],
    },
  },
  {
    id: 'anomaly-alerts',
    size: 'half',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Anomaly alerts',
    subtitle: 'Learn each metric\'s rhythm and ping you the moment it breaks.',
    extra: {
      headline: "Learn each metric's rhythm and get pinged when it breaks.",
      body: "Set a threshold or let the system learn the baseline automatically. Get a Slack message the moment sign-ups spike, crash rates creep up, or any metric you care about moves outside its normal band.",
      highlight: { label: '↓ 34 %', note: 'sign-ups below 7-day average — alert sent' },
      bullets: [
        'Adaptive baselines that learn seasonality',
        'Alert to Slack, email or any webhook',
        'Snooze or adjust sensitivity per metric',
      ],
    },
  },
];

/* ── Individual card component ── */
interface CardProps {
  item: BentoExpandItem;
  layoutId: string;
  onOpen: () => void;
}

function BentoCard({ item, layoutId, onOpen }: CardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={`${styles.card} ${item.size === 'full' ? styles.cardFull : styles.cardHalf}`}
      onClick={onOpen}
      style={{ borderRadius: 20 }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
    >
      <button
        type="button"
        className={styles.expandBtn}
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        aria-label={`Expand ${item.title}`}
        id={`bento-expand-${item.id}`}
      >
        <ExpandIcon />
      </button>

      <motion.div layoutId={`${layoutId}-icon`} className={styles.iconWrap}>
        {item.icon}
      </motion.div>

      <motion.h3 layoutId={`${layoutId}-title`} className={styles.cardTitle}>
        {item.title}
      </motion.h3>

      <motion.p layoutId={`${layoutId}-subtitle`} className={styles.cardSubtitle}>
        {item.subtitle}
      </motion.p>
    </motion.div>
  );
}

/* ── Modal component ── */
interface ModalProps {
  item: BentoExpandItem;
  layoutId: string;
  onClose: () => void;
}

function BentoModal({ item, layoutId, onClose }: ModalProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Expanded card — shares layoutId with the source card */}
      <motion.div
        layoutId={layoutId}
        className={styles.modal}
        style={{ borderRadius: 24 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
      >
        {/* Close button */}
        <motion.button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.15, duration: 0.2 }}
          id={`bento-close-${item.id}`}
        >
          <CloseIcon />
        </motion.button>

        {/* Icon */}
        <motion.div layoutId={`${layoutId}-icon`} className={styles.iconWrap} style={{ marginBottom: 16 }}>
          {item.icon}
        </motion.div>

        {/* Title */}
        <motion.h2 layoutId={`${layoutId}-title`} className={styles.modalTitle}>
          {item.title}
        </motion.h2>

        {/* Subtitle — bold headline in modal */}
        <motion.p layoutId={`${layoutId}-subtitle`} className={styles.modalHeadline}>
          {item.extra.headline || item.subtitle}
        </motion.p>

        {/* Extra content fades in after layout animation */}
        <motion.div
          className={styles.modalExtra}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ delay: 0.18, duration: 0.3 }}
        >
          <p className={styles.modalBody}>{item.extra.body}</p>

          {item.extra.highlight && (
            <div className={styles.highlight}>
              <span className={styles.highlightLabel}>{item.extra.highlight.label}</span>
              <span className={styles.highlightNote}>{item.extra.highlight.note}</span>
            </div>
          )}

          {item.extra.bullets && item.extra.bullets.length > 0 && (
            <ul className={styles.bullets}>
              {item.extra.bullets.map((b) => (
                <li key={b} className={styles.bullet}>
                  <span className={styles.bulletCheck}><CheckIcon /></span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

/* ── Main export ── */
export function BentoExpand({
  heading = 'See what changed.',
  subheading = 'Six surfaces, one line to install. Open any card to go deeper.',
  items = DEFAULT_ITEMS,
  theme = 'auto',
  style,
  className,
}: BentoExpandProps) {
  const uid = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = items.find((i) => i.id === activeId) ?? null;

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-theme={theme === 'auto' ? undefined : theme}
      style={style}
    >
      <div className={styles.inner}>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.subheading}>{subheading}</p>

        <LayoutGroup>
          <div className={styles.grid}>
            {items.map((item) => (
              <BentoCard
                key={item.id}
                item={item}
                layoutId={`${uid}-${item.id}`}
                onOpen={() => setActiveId(item.id)}
              />
            ))}
          </div>

          <AnimatePresence>
            {activeItem && (
              <div className={styles.modalLayer}>
                <BentoModal
                  item={activeItem}
                  layoutId={`${uid}-${activeItem.id}`}
                  onClose={() => setActiveId(null)}
                />
              </div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}
