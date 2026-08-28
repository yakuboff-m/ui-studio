'use client';

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import styles from './ExpandableTabs.module.scss';

export interface ExpandableTabsItem {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

export interface ExpandableTabsProps {
  items: ExpandableTabsItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null) => void;
  className?: string;
}

const SPRING_TRANSITION = {
  duration: 0.4,
  type: 'spring',
  bounce: 0,
} as const;

const LABEL_TRANSITION = {
  duration: 0.4,
  type: 'spring',
  bounce: 0,
} as const;

const PANEL_VARIANTS = {
  initial: (dir: number) => ({
    x: `${100 * dir}%`,
    opacity: 0,
  }),
  active: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: `${-100 * dir}%`,
    opacity: 0,
  }),
};

export const ExpandableTabs: React.FC<ExpandableTabsProps> = ({
  items,
  value,
  defaultValue = null,
  onValueChange,
  className = '',
}) => {
  const controlled = value !== undefined;
  const [internalId, setInternalId] = useState<string | null>(defaultValue);
  const activeId = controlled ? value : internalId;

  const [direction, setDirection] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(48);

  const activeIndex = items.findIndex((item) => item.id === activeId);
  const activeItem = items[activeIndex] ?? null;

  const setActive = useCallback(
    (next: string | null, nextIdx: number | null) => {
      if (activeId !== null && nextIdx !== null) {
        const prevIdx = items.findIndex((i) => i.id === activeId);
        setDirection(nextIdx > prevIdx ? 1 : -1);
      }
      if (!controlled) setInternalId(next);
      onValueChange?.(next);
    },
    [controlled, activeId, items, onValueChange]
  );

  // Measure content height dynamically
  useEffect(() => {
    if (!measureRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === measureRef.current) {
          setContentHeight(entry.target.scrollHeight);
        }
      }
    });
    observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (activeId !== null) {
          setActive(null, null);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeId, setActive]);

  const isOpen = activeId !== null;

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center">
      <MotionConfig transition={SPRING_TRANSITION}>
        <motion.div
          initial={false}
          animate={{
            height: !isOpen ? 48 : Math.max(contentHeight, 48),
            width: !isOpen ? 200 : 290,
          }}
          className={`${styles.skiperContainer} ${className}`}
        >
          <div ref={measureRef}>
            {/* Top Popover Content */}
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              {isOpen && activeItem && (
                <motion.div
                  key={activeItem.id}
                  custom={direction}
                  variants={PANEL_VARIANTS}
                  initial="initial"
                  animate="active"
                  exit="exit"
                  className={styles.contentWrapper}
                >
                  {activeItem.content}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Anchored Bottom Dock Bar */}
            <div className={styles.dockBar}>
              <div className={styles.tabList} role="tablist">
                {items.map((item, idx) => {
                  const isActive = item.id === activeId;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      initial={false}
                      animate={{
                        gap: isActive ? '0.5rem' : 0,
                        paddingLeft: isActive ? '1rem' : '0.5rem',
                        paddingRight: isActive ? '1rem' : '0.5rem',
                      }}
                      onClick={() => {
                        if (activeId === null) setActive(item.id, idx);
                        else if (activeId === item.id) setActive(null, null);
                        else setActive(item.id, idx);
                      }}
                      className={`${styles.tabButton} ${isActive ? styles.activeTab : ''}`}
                    >
                      <span className={styles.iconSpan}>{item.icon}</span>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={LABEL_TRANSITION}
                            className={styles.labelSpan}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  );
};
