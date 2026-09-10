export const FULL_MARKETPLACE_DOCK_TSX = `'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { motion, AnimatePresence, MotionConfig, LayoutGroup } from 'framer-motion';
import { Box } from '@mui/material';
import {
  Home,
  FileText,
  Search,
  SlidersHorizontal,
  Grip,
  User,
  X,
  ChevronRight,
  Info,
  Building2,
  Tag,
  LifeBuoy,
} from 'lucide-react';
import { SmoothInput } from '../SmoothInput';
import { GooeyInput } from '../GooeyInput';
import styles from './MarketplaceDock.module.scss';

const SPRING = { type: 'spring', bounce: 0.2, duration: 0.4 } as const;
const LABEL_SPRING = { type: 'spring', bounce: 0, duration: 0.35 } as const;

const PANEL_VARIANTS = {
  initial: (dir: number) => ({ x: \`\${100 * dir}%\`, opacity: 0 }),
  active:  { x: '0%', opacity: 1 },
  exit:    (dir: number) => ({ x: \`\${-100 * dir}%\`, opacity: 0 }),
};

/* ─────────── Gooey Filter ─────────── */
function GooeyFilter({
  filterId,
  blur = 6,
}: {
  filterId: string;
  blur?: number;
}) {
  return (
    <svg className={styles.gooeyFilterSvg} aria-hidden="true">
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

/* ─────────── types ─────────── */
type NavId     = 'home' | 'posts' | 'mypage';
type PopoverId = 'filter' | 'more';
type DockId    = NavId | PopoverId | 'search';

const NAV_IDS:     NavId[]     = ['home', 'posts', 'mypage'];
const POPOVER_IDS: PopoverId[] = ['filter', 'more'];

/* ─────────── dimensions ─────────── */
// 6 icons × 36px + 6px×2 paddings + gaps = 252px closed
const W_CLOSED = 252;
// 1 expanded label button + 5 compact + paddings = 310px open
const W_OPEN   = 310;
// search bar width
const W_SEARCH = 280;

/* ─────────── filter options ─────────── */
const SORT_OPTIONS = [
  { id: 'latest',     label: 'Latest Registered' },
  { id: 'expiry_asc', label: 'Closest Expiry' },
  { id: 'price_asc',  label: 'Lowest Price' },
  { id: 'price_desc', label: 'Highest Price' },
] as const;

const EXPIRY_OPTIONS = [
  { id: 'all',      label: 'All Items',      dotClass: styles.dot_all },
  { id: 'normal',   label: 'Within 30 Days', dotClass: styles.dot_normal },
  { id: 'warning',  label: 'Within 7 Days',  dotClass: styles.dot_warning },
  { id: 'critical', label: 'Within 3 Days',  dotClass: styles.dot_critical },
  { id: 'expired',  label: 'Expired',        dotClass: styles.dot_expired },
] as const;

/* ─────────── button definitions ─────────── */
interface DockBtnDef {
  id: DockId;
  label: string;
  icon: React.ReactNode;
}

const DOCK_BUTTONS: DockBtnDef[] = [
  { id: 'home',   label: 'Home',    icon: <Home size={18} strokeWidth={2} /> },
  { id: 'posts',  label: 'Posts',   icon: <FileText size={18} strokeWidth={2} /> },
  { id: 'search', label: 'Search',  icon: <Search size={18} strokeWidth={2} /> },
  { id: 'filter', label: 'Filter',  icon: <SlidersHorizontal size={18} strokeWidth={2} /> },
  { id: 'more',   label: 'More',    icon: <Grip size={18} strokeWidth={2} /> },
  { id: 'mypage', label: 'Profile', icon: <User size={18} strokeWidth={2} /> },
];

/* ─────────── component ─────────── */
export const MarketplaceDock: React.FC = () => {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const filterId = \`marketplace-gooey-filter-\${safeId}\`;
  const searchIconLayoutId = \`dock-search-icon-\${safeId}\`;

  /* nav selection state (default 'home') */
  const [activeNav, setActiveNav] = useState<NavId | null>('home');
  /* popover state: 'filter' | 'more' | null */
  const [activePopover, setActivePopover] = useState<PopoverId | null>(null);
  /* search mode boolean */
  const [isSearch, setIsSearch]            = useState(false);
  const [searchQuery, setSearchQuery]      = useState('');

  /* filter selection values */
  const [sortBy, setSortBy]         = useState('latest');
  const [expiryStatus, setExpiryStatus] = useState('all');
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');

  /* layout state */
  const [direction, setDirection]         = useState<number>(1);
  const [panelHeight, setPanelHeight]     = useState<number>(0);

  const containerRef    = useRef<HTMLDivElement>(null);
  const panelMeasureRef = useRef<HTMLDivElement>(null);
  const searchInputRef  = useRef<HTMLInputElement>(null);

  /* active item derivation */
  const activeDockId: DockId | null = isSearch
    ? 'search'
    : activePopover !== null
      ? activePopover
      : activeNav;

  /* handle click on any dock button */
  const handleDockClick = (id: DockId) => {
    if (id === 'search') {
      setIsSearch(true);
      setActivePopover(null);
      return;
    }

    setIsSearch(false);

    if (POPOVER_IDS.includes(id as PopoverId)) {
      const pId = id as PopoverId;
      setActivePopover(prev => (prev === pId ? null : pId));
    } else if (NAV_IDS.includes(id as NavId)) {
      const nId = id as NavId;
      setActiveNav(prev => (prev === nId ? null : nId));
      setActivePopover(null);
    }
  };

  const exitSearch = useCallback(() => {
    setIsSearch(false);
    setSearchQuery('');
  }, []);

  /* measure panel content height */
  useEffect(() => {
    if (!panelMeasureRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === panelMeasureRef.current) {
          setPanelHeight(entry.target.scrollHeight);
        }
      }
    });
    observer.observe(panelMeasureRef.current);
    return () => observer.disconnect();
  }, []);

  /* auto focus search input */
  useEffect(() => {
    if (isSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearch]);

  /* click outside to close popover / search */
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
        if (isSearch) exitSearch();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isSearch, exitSearch]);

  /* direction calculation when activePopover changes */
  const prevPopoverRef = useRef<PopoverId | null>(activePopover);
  useEffect(() => {
    if (prevPopoverRef.current && activePopover) {
      const order: PopoverId[] = ['filter', 'more'];
      const pIdx = order.indexOf(prevPopoverRef.current);
      const nIdx = order.indexOf(activePopover);
      setDirection(nIdx > pIdx ? 1 : -1);
    } else {
      setDirection(1);
    }
    prevPopoverRef.current = activePopover;
  }, [activePopover]);

  /* computed width & height */
  const hasPopover = activePopover !== null;
  const anyActive  = activeDockId !== null;

  const currentWidth  = isSearch ? W_SEARCH : anyActive ? W_OPEN : W_CLOSED;
  const currentHeight = isSearch
    ? 48
    : hasPopover
      ? Math.max(panelHeight, 48)
      : 48;

  const isButtonActive = (id: DockId) => {
    if (isSearch) return id === 'search';
    if (hasPopover) return activePopover === id;
    return activeNav === id;
  };

  return (
    <Box className={styles.wrapper}>
      {/* SVG Gooey Filter definition */}
      <GooeyFilter filterId={filterId} blur={8} />

      <div ref={containerRef} className={styles.innerWrapper}>
        <LayoutGroup id={safeId}>
        <AnimatePresence mode="popLayout">
          {isSearch ? (
            /* ── Gooey Search Mode ── */
            <motion.div
              key="gooey-search"
              className={styles.gooeyFilterWrap}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <GooeyInput
                placeholder="Search products…"
                defaultExpanded={true}
                value={searchQuery}
                onValueChange={setSearchQuery}
                onOpenChange={(open) => {
                  if (!open) exitSearch();
                }}
                collapsedWidth={115}
                expandedWidth={220}
                expandedOffset={50}
              />
            </motion.div>
          ) : (
            /* ── Normal Dock Navigation ── */
            <motion.div
              key="normal-dock-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MotionConfig transition={SPRING}>
                <motion.div
                  initial={false}
                  animate={{ width: currentWidth, height: currentHeight }}
                  className={styles.container}
                >
                  {/* ── Popover Panel ── */}
                  <div ref={panelMeasureRef}>
                    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                      {hasPopover && (
                        <motion.div
                          key={activePopover}
                          custom={direction}
                          variants={PANEL_VARIANTS}
                          initial="initial"
                          animate="active"
                          exit="exit"
                          className={styles.panelWrap}
                        >
                          {activePopover === 'filter' && (
                            <div className={styles.popoverContent}>
                              {/* Two-column top row: Sort By & Expiry Status */}
                              <div className={styles.filterTopRow}>
                                {/* Left: Sort By */}
                                <div className={styles.filterSection}>
                                  <span className={styles.sectionLabel}>Sort By</span>
                                  <div className={styles.blockList}>
                                    {SORT_OPTIONS.map(opt => (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSortBy(opt.id)}
                                        className={\`\${styles.blockOption} \${
                                          sortBy === opt.id ? styles.blockOptionActive : ''
                                        }\`}
                                      >
                                        <span className={styles.blockDot} />
                                        <span>{opt.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className={styles.filterDivider} />

                                {/* Right: Expiry Status */}
                                <div className={styles.filterSection}>
                                  <span className={styles.sectionLabel}>Expiry</span>
                                  <div className={styles.blockList}>
                                    {EXPIRY_OPTIONS.map(opt => (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setExpiryStatus(opt.id)}
                                        className={\`\${styles.blockOption} \${
                                          expiryStatus === opt.id ? styles.blockOptionActive : ''
                                        }\`}
                                      >
                                        <span className={\`\${styles.blockDot} \${opt.dotClass}\`} />
                                        <span>{opt.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Bottom: Price Range inputs */}
                              <div className={styles.filterSection}>
                                <span className={styles.sectionLabel}>Price Range</span>
                                <div className={styles.priceRow}>
                                  <div className={styles.priceBox}>
                                    <span className={styles.priceSign}>$</span>
                                    <input
                                      type="number"
                                      placeholder="Min"
                                      value={minPrice}
                                      onChange={e => setMinPrice(e.target.value)}
                                      className={styles.priceInput}
                                    />
                                  </div>
                                  <span className={styles.priceSep}>–</span>
                                  <div className={styles.priceBox}>
                                    <span className={styles.priceSign}>$</span>
                                    <input
                                      type="number"
                                      placeholder="Max"
                                      value={maxPrice}
                                      onChange={e => setMaxPrice(e.target.value)}
                                      className={styles.priceInput}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activePopover === 'more' && (
                            <div className={styles.popoverContent}>
                              <button type="button" className={styles.moreLink}>
                                <div className={styles.moreLinkLeft}>
                                  <Info size={16} className={styles.moreLinkIcon} />
                                  <span>Service Guide</span>
                                </div>
                                <ChevronRight size={14} className={styles.moreLinkArrow} />
                              </button>
                              <button type="button" className={styles.moreLink}>
                                <div className={styles.moreLinkLeft}>
                                  <Building2 size={16} className={styles.moreLinkIcon} />
                                  <span>Seller Center</span>
                                </div>
                                <ChevronRight size={14} className={styles.moreLinkArrow} />
                              </button>
                              <button type="button" className={styles.moreLink}>
                                <div className={styles.moreLinkLeft}>
                                  <Tag size={16} className={styles.moreLinkIcon} />
                                  <span>Coupons & Perks</span>
                                </div>
                                <ChevronRight size={14} className={styles.moreLinkArrow} />
                              </button>
                              <button type="button" className={styles.moreLink}>
                                <div className={styles.moreLinkLeft}>
                                  <LifeBuoy size={16} className={styles.moreLinkIcon} />
                                  <span>Customer Support</span>
                                </div>
                                <ChevronRight size={14} className={styles.moreLinkArrow} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── Dock bar (absolute bottom) ── */}
                  <div className={styles.dockBar}>
                    <div className={styles.tabList} role="tablist">
                      {DOCK_BUTTONS.map(btn => {
                        const active = isButtonActive(btn.id);
                        const isSearchBtn = btn.id === 'search';
                        return (
                          <motion.button
                            key={btn.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            initial={false}
                            animate={{
                              gap:          active ? '0.45rem' : 0,
                              paddingLeft:  active ? '0.85rem' : '0.5rem',
                              paddingRight: active ? '0.85rem' : '0.5rem',
                            }}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleDockClick(btn.id)}
                            className={\`\${styles.tabButton} \${active ? styles.activeTab : ''}\`}
                          >
                            {isSearchBtn ? (
                              /* The search icon shares layoutId so it animates to gooey search bubble */
                              <motion.span
                                layoutId={searchIconLayoutId}
                                className={styles.iconSpan}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {btn.icon}
                              </motion.span>
                            ) : (
                              <span className={styles.iconSpan}>
                                {btn.icon}
                              </span>
                            )}
                            <AnimatePresence initial={false}>
                              {active && (
                                <motion.span
                                  initial={{ width: 0, opacity: 0 }}
                                  animate={{ width: 'auto', opacity: 1 }}
                                  exit={{ width: 0, opacity: 0 }}
                                  transition={LABEL_SPRING}
                                  className={styles.labelSpan}
                                >
                                  {btn.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </MotionConfig>
            </motion.div>
          )}
        </AnimatePresence>
        </LayoutGroup>
      </div>
    </Box>
  );
};

`;

export const FULL_MARKETPLACE_DOCK_SCSS = `@use "../../../styles/variables.scss" as *;

/* ── Outer wrapper ── */
.wrapper {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
}

.innerWrapper {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.gooeyFilterWrap {
  position: relative;
  display: flex;
  flex-direction: row;
  height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.searchBarMotion {
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.searchPillSurface {
  display: flex;
  align-items: center;
  height: 48px;
  width: 100%;
  border-radius: 9999px;
  background: #ffffff;
  color: #0f172a;
  padding: 0 10px 0 16px;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08), 0 16px 40px -10px rgba(0, 0, 0, 0.12);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;

  :global([data-theme='dark']) & {
    background: #1a1f2e;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px -12px rgba(0, 0, 0, 0.7);
  }
}

.bubbleMotion {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.bubbleSurface {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #ffffff;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08), 0 16px 40px -10px rgba(0, 0, 0, 0.12);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;

  :global([data-theme='dark']) & {
    background: #1a1f2e;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px -12px rgba(0, 0, 0, 0.7);
  }

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.gooeyFilterSvg {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ── Animated outer card ── */
.container {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08), 0 16px 40px -10px rgba(0, 0, 0, 0.12);
  transition: background-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;

  :global([data-theme='dark']) & {
    background: #1a1f2e;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 50px -12px rgba(0, 0, 0, 0.7);
  }
}

/* ── Popover panel above dock ── */
.panelWrap {
  padding: 14px 14px 56px 14px;
  box-sizing: border-box;
  width: 100%;
}

/* ── Shared popover content ── */
.popoverContent {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Filter layout ─── */

/* Two-column top row: Sort By | Expiry Status */
.filterTopRow {
  display: flex;
  gap: 0;
  align-items: flex-start;

  .filterSection {
    flex: 1;
    min-width: 0;
  }
}

/* vertical separator between the two columns */
.filterDivider {
  width: 1px;
  background: rgba(0, 0, 0, 0.08);
  align-self: stretch;
  margin: 0 10px;
  flex-shrink: 0;

  :global([data-theme='dark']) & {
    background: rgba(255, 255, 255, 0.08);
  }
}

.filterSection {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sectionLabel {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #64748b;
  padding: 0 2px;
  margin-bottom: 2px;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.32);
  }
}

/* ── Block list options (Sort By & Expiry) ── */
.blockList {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.blockOption {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 5px 7px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 0.77rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.13s ease, color 0.13s ease;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.45);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #0f172a;

    :global([data-theme='dark']) & {
      background: rgba(255, 255, 255, 0.07);
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &.blockOptionActive {
    background: rgba(99, 102, 241, 0.1);
    color: #4f46e5;
    font-weight: 600;

    :global([data-theme='dark']) & {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    .blockDot { opacity: 1; }
  }
}

.blockDot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #6366f1;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.13s ease;

  :global([data-theme='dark']) & {
    background: rgba(255, 255, 255, 0.5);
  }
}

/* colored dots for expiry status */
.dot_all      { background: #64748b; }
.dot_normal   { background: #10b981; }
.dot_warning  { background: #f59e0b; }
.dot_critical { background: #f97316; }
.dot_expired  { background: #ef4444; }

/* price range */
.priceRow {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.priceBox {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  background: #f1f5f9;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 0 10px;
  transition: border-color 0.15s ease, background 0.15s ease;
  min-width: 0;

  :global([data-theme='dark']) & {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  &:focus-within {
    border-color: #6366f1;
    background: #ffffff;

    :global([data-theme='dark']) & {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.09);
    }
  }
}

.priceSign {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  flex-shrink: 0;
  line-height: 1;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.5);
  }
}

.priceInput {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.82rem;
  font-weight: 500;
  color: #0f172a;
  padding: 0;

  :global([data-theme='dark']) & {
    color: #ffffff;
  }

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;

    :global([data-theme='dark']) & {
      color: rgba(255, 255, 255, 0.28);
    }
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.priceSep {
  font-size: 0.8rem;
  font-weight: 500;
  color: #94a3b8;
  flex-shrink: 0;
  line-height: 1;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.25);
  }
}

/* ─── More links ─── */
.moreLink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 11px;
  border: none;
  background: transparent;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  width: 100%;
  text-align: left;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.7);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #0f172a;

    :global([data-theme='dark']) & {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .moreLinkArrow { opacity: 1; transform: translateX(2px); }
  }
}

.moreLinkLeft {
  display: flex;
  align-items: center;
  gap: 9px;
}

.moreLinkIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  flex-shrink: 0;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.45);
  }

  .moreLink:hover & {
    color: #0f172a;

    :global([data-theme='dark']) & {
      color: rgba(255, 255, 255, 0.75);
    }
  }
}

.moreLinkArrow {
  opacity: 0.4;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

/* ─── Dock bar ─── */
.dockBar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  background: inherit;

  :global([data-theme='dark']) & {
    background: inherit;
  }
}

/* ─── Search mode ─── */
.searchRow {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 10px 0 14px;
  height: 100%;
  box-sizing: border-box;
}

.searchLeftIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #64748b;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.45);
  }
}

.searchIcon {
  flex-shrink: 0;
  color: inherit;
}

.searchInputContainer {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: 100%;
}

.searchSmoothWrapper {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.searchInput {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.85rem;
  font-weight: 500;
  color: #0f172a;
  padding: 0;

  :global([data-theme='dark']) & {
    color: #ffffff;
  }

  &::placeholder {
    color: #94a3b8;

    :global([data-theme='dark']) & {
      color: rgba(255, 255, 255, 0.35);
    }
  }

  &::-webkit-search-cancel-button,
  &::-webkit-search-decoration,
  &::-webkit-search-results-button,
  &::-webkit-search-results-decoration {
    -webkit-appearance: none;
    display: none;
  }
}

.searchRightAction {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.searchCloseBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #64748b;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: background 0.15s ease, color 0.15s ease;

  :global([data-theme='dark']) & {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.12);
    color: #0f172a;

    :global([data-theme='dark']) & {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
    }
  }
}

/* ─── Normal dock button row ─── */
.tabList {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  box-sizing: border-box;
}

.tabButton {
  position: relative;
  display: flex;
  padding: 0;
  height: 36px;
  min-width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  outline: none;
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
  transition: background 0.18s ease, color 0.18s ease;

  :global([data-theme='dark']) & {
    color: rgba(255, 255, 255, 0.42);
  }

  &:first-of-type {
    border-radius: 18px 10px 10px 18px;
  }

  &:last-of-type {
    border-radius: 10px 18px 18px 10px;
  }

  &:only-of-type {
    border-radius: 18px;
  }

  &:hover:not(.activeTab) {
    background: rgba(0, 0, 0, 0.05);
    color: #0f172a;

    :global([data-theme='dark']) & {
      background: rgba(255, 255, 255, 0.07);
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &.activeTab {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    font-weight: 600;

    :global([data-theme='dark']) & {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
  }
}

.iconSpan {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dockGifIcon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

.labelSpan {
  overflow: hidden;
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: -0.01em;
}
`;

export const FULL_EXPANDABLE_TABS_TSX = `'use client';

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
    x: \`\${100 * dir}%\`,
    opacity: 0,
  }),
  active: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: \`\${-100 * dir}%\`,
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
          className={\`\${styles.skiperContainer} \${className}\`}
        >
          <div ref={measureRef}>
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
                      className={\`\${styles.tabButton} \${isActive ? styles.activeTab : ''}\`}
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
};`;

export const FULL_EXPANDABLE_TABS_SCSS = `@use "../../../styles/variables.scss" as *;

.skiperContainer {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.12);
  transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;

  :global([data-theme='dark']) & {
    background: #1a1f2e;
    color: #f1f5f9;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.7);
  }
}

.contentWrapper {
  padding: 16px 16px 56px 16px;
  box-sizing: border-box;
  width: 100%;
}

.dockBar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  background: inherit;
}

.tabList {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  box-sizing: border-box;
}

.tabButton {
  position: relative;
  display: flex;
  height: 36px;
  min-width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  outline: none;
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
  transition: background 0.18s ease, color 0.18s ease;

  &.activeTab {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    font-weight: 600;
  }
}`;

export const FULL_SMOOTH_INPUT_TSX = `'use client';

import React, {
  type ComponentPropsWithRef,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import styles from './SmoothInput.module.scss';

export type SmoothInputProps = ComponentPropsWithRef<'input'> & {
  wrapperClassName?: string;
  isDockMode?: boolean;
};

export const SmoothInput = forwardRef<HTMLInputElement, SmoothInputProps>(({
  className = '',
  wrapperClassName = '',
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  type = 'text',
  placeholder,
  style,
  isDockMode = false,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const innerInputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => innerInputRef.current as HTMLInputElement);

  const isControlled = value !== undefined;
  const inputValue = isControlled ? String(value) : internalValue;

  const springCaretX = useSpring(caretX, { stiffness: 500, damping: 30, mass: 0.5 });

  return (
    <div className={\`\${isDockMode ? styles.dockWrapper : styles.inputWrapper} \${wrapperClassName}\`}>
      <div ref={containerRef} className={styles.containerGrid}>
        <input
          {...props}
          ref={innerInputRef}
          type={type}
          placeholder={placeholder}
          className={\`\${styles.inputField} \${className}\`}
          style={style}
          value={inputValue}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
          }}
        />
        <motion.div
          className={styles.smoothCaret}
          style={{ x: springCaretX, opacity: caretOpacity }}
        />
      </div>
    </div>
  );
});

SmoothInput.displayName = 'SmoothInput';`;

export const FULL_SMOOTH_INPUT_SCSS = `@use "../../../styles/variables.scss" as *;

.inputWrapper {
  position: relative;
  width: 100%;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 12px 16px;

  :global([data-theme='dark']) & {
    background: rgba(17, 24, 39, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
}

.smoothCaret {
  height: 1.05em;
  width: 2px;
  background-color: #6366f1;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
}`;

export const FULL_CUSTOM_BUTTON_TSX = `'use client';

import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import styles from './CustomButton.module.scss';

export interface CustomButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'glow' | 'glass' | 'neon' | 'contained' | 'outlined' | 'text';
  loading?: boolean;
  pulse?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  variant = 'glow',
  loading = false,
  pulse = false,
  className = '',
  disabled,
  ...props
}) => {
  let computedClassName = className;
  let muiVariant: MuiButtonProps['variant'] = 'contained';

  if (variant === 'glow') {
    computedClassName += \` \${styles.buttonGlow}\`;
    muiVariant = 'contained';
  } else if (variant === 'glass') {
    computedClassName += \` \${styles.buttonGlass}\`;
    muiVariant = 'outlined';
  } else if (variant === 'neon') {
    computedClassName += \` \${styles.buttonNeon}\`;
    muiVariant = 'outlined';
  } else {
    muiVariant = variant;
  }

  if (pulse) {
    computedClassName += \` \${styles.pulseEffect}\`;
  }

  return (
    <MuiButton
      variant={muiVariant}
      disabled={disabled || loading}
      className={computedClassName}
      {...props}
    >
      {loading ? <CircularProgress size={22} color="inherit" /> : children}
    </MuiButton>
  );
};`;

export const FULL_CUSTOM_BUTTON_SCSS = `@use "../../../styles/variables.scss" as *;

.buttonGlow {
  position: relative;
  background: $gradient-primary !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.5) !important;
  }
}`;

export const FULL_CUSTOM_CARD_TSX = `'use client';

import React from 'react';
import { Card as MuiCard, CardProps as MuiCardProps, Box, Typography } from '@mui/material';
import styles from './CustomCard.module.scss';

export interface CustomCardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  variantType?: 'glass' | 'solid' | 'neon';
  hover?: boolean;
  topGlow?: boolean;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  children,
  title,
  subtitle,
  action,
  variantType = 'glass',
  hover = true,
  topGlow = true,
  className = '',
  ...props
}) => {
  let computedClassName = \`\${styles.cardContainer} \${className}\`;
  if (variantType === 'glass') computedClassName += \` \${styles.glassVariant}\`;
  if (hover) computedClassName += \` \${styles.hoverEffect}\`;
  if (topGlow) computedClassName += \` \${styles.glowBorder}\`;

  return (
    <MuiCard className={computedClassName} {...props}>
      {(title || action) && (
        <Box className={styles.cardHeader}>
          <Box>
            {title && <Typography className={styles.cardTitle}>{title}</Typography>}
            {subtitle && <Typography className={styles.cardSub}>{subtitle}</Typography>}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      )}
      {children}
    </MuiCard>
  );
};`;

export const FULL_CUSTOM_CARD_SCSS = `@use "../../../styles/variables.scss" as *;

.cardContainer {
  position: relative;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  border-radius: 20px !important;
  padding: 24px;
}`;

export const FULL_CUSTOM_INPUT_TSX = `'use client';

import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';
import styles from './CustomInput.module.scss';

export type CustomInputProps = MuiTextFieldProps & {
  glowOnFocus?: boolean;
};

export const CustomInput: React.FC<CustomInputProps> = ({
  glowOnFocus = true,
  className = '',
  variant = 'outlined',
  fullWidth = true,
  ...props
}) => {
  return (
    <MuiTextField
      variant={variant}
      fullWidth={fullWidth}
      className={\`\${styles.inputWrapper} \${className}\`}
      {...props}
    />
  );
};`;

export const FULL_CUSTOM_INPUT_SCSS = `@use "../../../styles/variables.scss" as *;

.inputWrapper {
  & .MuiOutlinedInput-root {
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 12px !important;

    &.Mui-focused {
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
    }
  }
}`;

export const FULL_CUSTOM_BADGE_TSX = `'use client';

import React from 'react';
import { Chip as MuiChip, ChipProps as MuiChipProps, Box } from '@mui/material';
import styles from './CustomBadge.module.scss';

export interface CustomBadgeProps extends Omit<MuiChipProps, 'variant'> {
  status?: 'active' | 'busy' | 'warning' | 'gradient';
  pulse?: boolean;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
  label,
  status = 'active',
  pulse = true,
  className = '',
  ...props
}) => {
  let statusClass = styles.statusActive;
  if (status === 'busy') statusClass = styles.statusBusy;
  if (status === 'warning') statusClass = styles.statusWarning;
  if (status === 'gradient') statusClass = styles.statusGradient;

  return (
    <MuiChip
      label={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {pulse && <span className={styles.pulseDot} />}
          {label}
        </Box>
      }
      className={\`\${styles.badgeChip} \${statusClass} \${className}\`}
      {...props}
    />
  );
};`;

export const FULL_CUSTOM_BADGE_SCSS = `@use "../../../styles/variables.scss" as *;

.badgeChip {
  font-weight: 600 !important;
  border-radius: 20px !important;

  &.statusActive {
    background: rgba(16, 185, 129, 0.12) !important;
    color: #047857 !important;
  }
}`;

export const FULL_CUSTOM_SWITCH_TSX = `'use client';

import React from 'react';
import { Switch as MuiSwitch, SwitchProps as MuiSwitchProps, FormControlLabel } from '@mui/material';
import styles from './CustomSwitch.module.scss';

export interface CustomSwitchProps extends MuiSwitchProps {
  label?: string;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  label,
  className = '',
  ...props
}) => {
  const switchElement = (
    <MuiSwitch
      className={\`\${styles.neonSwitch} \${className}\`}
      {...props}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={switchElement}
        label={label}
        sx={{
          color: 'text.primary',
          '& .MuiFormControlLabel-label': {
            fontSize: '0.9rem',
            fontWeight: 500,
          },
        }}
      />
    );
  }

  return switchElement;
};`;

export const FULL_CUSTOM_SWITCH_SCSS = `@use "../../../styles/variables.scss" as *;

.neonSwitch {
  & .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
    background: $gradient-primary !important;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
  }
}`;

export const FULL_GOOEY_INPUT_TSX = `'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './GooeyInput.module.scss';

function GooeyFilter({
  filterId,
  blur,
}: {
  filterId: string;
  blur: number;
}) {
  return (
    <svg className={styles.filterSvg} aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function SearchIcon({ layoutId }: { layoutId: string }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className={styles.searchIcon}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.4,
  type: 'spring' as const,
  bounce: 0.25,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

export interface GooeyInputClassNames {
  root?: string;
  filterWrap?: string;
  buttonRow?: string;
  trigger?: string;
  input?: string;
  bubble?: string;
  bubbleSurface?: string;
}

export interface GooeyInputProps {
  placeholder?: string;
  className?: string;
  classNames?: GooeyInputClassNames;
  /** Collapsed control width in px */
  collapsedWidth?: number;
  /** Expanded control width in px */
  expandedWidth?: number;
  /** Horizontal offset when expanded (px), aligns detached bubble */
  expandedOffset?: number;
  /** Gaussian blur amount for the gooey SVG filter */
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

export function GooeyInput({
  placeholder = 'Type to search...',
  className = '',
  classNames,
  collapsedWidth = 115,
  expandedWidth = 200,
  expandedOffset = 50,
  gooeyBlur = 5,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onOpenChange,
  disabled = false,
  defaultExpanded = false,
}: GooeyInputProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, '');
  const filterId = \`gooey-filter-\${safeId}\`;
  const iconLayoutId = \`gooey-input-icon-\${safeId}\`;
  const inputLayoutId = \`gooey-input-field-\${safeId}\`;

  const inputRef = useRef<HTMLInputElement>(null);
  const prevExpandedRef = useRef(defaultExpanded);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else if (prevExpandedRef.current) {
      setSearchText('');
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, setSearchText]);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: collapsedWidth, marginLeft: 0 },
      expanded: { width: expandedWidth, marginLeft: expandedOffset },
    }),
    [collapsedWidth, expandedWidth, expandedOffset]
  );

  const handleExpand = useCallback(() => {
    if (!disabled) setExpanded(true);
  }, [disabled, setExpanded]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText]
  );

  const handleBlur = useCallback(() => {
    if (!searchText) setExpanded(false);
  }, [searchText, setExpanded]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (searchText) {
          setSearchText('');
        } else {
          setExpanded(false);
        }
      }
    },
    [searchText, setSearchText, setExpanded]
  );

  return (
    <div
      className={\`\${styles.root} \${className} \${classNames?.root || ''}\`}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      <div
        className={\`\${styles.filterWrap} \${classNames?.filterWrap || ''}\`}
        style={{ filter: \`url(#\${filterId})\` }}
      >
        <motion.div
          className={\`\${styles.buttonRow} \${classNames?.buttonRow || ''}\`}
          variants={buttonVariants}
          initial={defaultExpanded ? 'expanded' : 'collapsed'}
          animate={isExpanded ? 'expanded' : 'collapsed'}
          transition={transition}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={handleExpand}
            className={\`\${styles.surface} \${styles.trigger} \${classNames?.trigger || ''}\`}
          >
            {!isExpanded ? (
              <SearchIcon layoutId={iconLayoutId} />
            ) : null}
            <motion.input
              layoutId={inputLayoutId}
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={searchText}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={disabled || !isExpanded}
              placeholder={placeholder}
              className={\`\${styles.input} \${
                isExpanded ? styles.inputExpanded : styles.inputCollapsed
              } \${classNames?.input || ''}\`}
            />
            {isExpanded && (
              <motion.button
                type="button"
                className={styles.closeBtn}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (searchText) {
                    setSearchText('');
                    inputRef.current?.focus();
                  } else {
                    setExpanded(false);
                  }
                }}
                aria-label="Clear or close search"
                title={searchText ? 'Clear text' : 'Close search (Esc)'}
              >
                <X size={14} strokeWidth={2.4} />
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          className={\`\${styles.bubble} \${classNames?.bubble || ''}\`}
          variants={iconBubbleVariants}
          initial={defaultExpanded ? 'expanded' : 'collapsed'}
          animate={isExpanded ? 'expanded' : 'collapsed'}
          transition={transition}
          onClick={() => inputRef.current?.focus()}
        >
          <div
            className={\`\${styles.surface} \${styles.bubbleSurface} \${classNames?.bubbleSurface || ''}\`}
          >
            <SearchIcon layoutId={iconLayoutId} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default GooeyInput;
`;

export const FULL_GOOEY_INPUT_SCSS = `@use "../../../styles/variables.scss" as *;

.root {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.filterSvg {
  position: absolute;
  height: 0;
  width: 0;
  overflow: hidden;
  pointer-events: none;
}

.filterWrap {
  position: relative;
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
}

.buttonRow {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
}

/* ── Surface styling (bg-foreground text-background) ── */
.surface {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;

  :global([data-theme='dark']) & {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.trigger {
  display: flex;
  height: 40px;
  width: 100%;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9999px;
  padding: 0 14px 0 16px;
  font-size: 0.875rem;
  font-weight: 500;
  outline: none;
  border: none;
  box-sizing: border-box;

  &:focus-visible {
    box-shadow: 0 0 0 2px #6366f1, 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
}

.input {
  height: 100%;
  min-width: 0;
  flex: 1;
  background: transparent;
  font-size: 0.875rem;
  outline: none;
  border: none;
  font-family: inherit;
  color: inherit;

  &::-webkit-search-cancel-button {
    display: none;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.2s ease;

    :global([data-theme='dark']) & {
      color: rgba(15, 23, 42, 0.5);
    }
  }
}

.inputCollapsed {
  pointer-events: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.8);

    :global([data-theme='dark']) & {
      color: rgba(15, 23, 42, 0.75);
    }
  }
}

.inputExpanded {
  pointer-events: auto;
}

.closeBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  flex-shrink: 0;
  transition: background-color 0.15s ease, transform 0.15s ease;

  :global([data-theme='dark']) & {
    background: rgba(0, 0, 0, 0.08);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);

    :global([data-theme='dark']) & {
      background: rgba(0, 0, 0, 0.15);
    }
  }

  &:active {
    transform: scale(0.9);
  }
}

.bubble {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  margin: auto 0;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.bubbleSurface {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: none;
}

.searchIcon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
`;

export const FULL_RESIZABLE_NAV_TSX = `'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { SmoothInput } from '../SmoothInput/SmoothInput';
import {
  Home,
  FileText,
  Search,
  SlidersHorizontal,
  Grip,
  User,
  X,
  ChevronRight,
  Info,
  Building2,
  Tag,
  LifeBuoy,
  ShoppingCart,
  Bell,
  Scan,
  Store,
  ArrowUp,
} from 'lucide-react';
import styles from './ResizableMarketplaceNav.module.scss';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS — match MarketplaceDock exactly
   ═══════════════════════════════════════════════════════════════ */
const GOOEY_SPRING = { type: 'spring' as const, stiffness: 120, damping: 18, mass: 1.2 };
const LABEL_SPRING = { type: 'spring' as const, bounce: 0, duration: 0.35 };
const FAST_FADE    = { duration: 0.14 };

type NavId     = 'home' | 'posts' | 'mypage';
type PopoverId = 'filter' | 'more';
type DockId    = NavId | PopoverId | 'search';
type Mode      = 'dock' | 'collapsed' | 'expanded';

const DOCK_BUTTONS: { id: DockId; label: string; icon: React.ReactNode }[] = [
  { id: 'home',   label: 'Home',    icon: <Home size={18} strokeWidth={2} /> },
  { id: 'posts',  label: 'Posts',   icon: <FileText size={18} strokeWidth={2} /> },
  { id: 'search', label: 'Search',  icon: <Search size={18} strokeWidth={2} /> },
  { id: 'filter', label: 'Filter',  icon: <SlidersHorizontal size={18} strokeWidth={2} /> },
  { id: 'more',   label: 'More',    icon: <Grip size={18} strokeWidth={2} /> },
  { id: 'mypage', label: 'Profile', icon: <User size={18} strokeWidth={2} /> },
];

const SORT_OPTIONS = [
  { id: 'latest',     label: 'Latest Registered' },
  { id: 'expiry_asc', label: 'Closest Expiry' },
  { id: 'price_asc',  label: 'Lowest Price' },
  { id: 'price_desc', label: 'Highest Price' },
] as const;

const EXPIRY_OPTIONS = [
  { id: 'all',      label: 'All Items',      cls: 'dotAll' },
  { id: 'normal',   label: 'Within 30 Days', cls: 'dotNormal' },
  { id: 'warning',  label: 'Within 7 Days',  cls: 'dotWarning' },
  { id: 'critical', label: 'Within 3 Days',  cls: 'dotCritical' },
  { id: 'expired',  label: 'Expired',        cls: 'dotExpired' },
] as const;

const DUMMY_PRODUCTS = [
  { id: 1, title: 'Minimalist Ceramic Vase', price: '$48.00', category: 'Home Decor', tag: 'Trending', rating: '4.9', badgeColor: '#6366f1' },
  { id: 2, title: 'Ergonomic Walnut Desk Mat', price: '$89.00', category: 'Workspace', tag: 'New Arrival', rating: '4.8', badgeColor: '#10b981' },
  { id: 3, title: 'Wireless Mechanical Keyboard', price: '$149.00', category: 'Electronics', tag: 'Bestseller', rating: '5.0', badgeColor: '#f59e0b' },
  { id: 4, title: 'Anodized Aluminum Lamp', price: '$112.00', category: 'Lighting', tag: 'Sale -20%', rating: '4.7', badgeColor: '#ec4899' },
  { id: 5, title: 'Noise-Cancelling Headphones', price: '$260.00', category: 'Audio', tag: 'Premium', rating: '4.9', badgeColor: '#8b5cf6' },
  { id: 6, title: 'Handcrafted Leather Cardholder', price: '$35.00', category: 'Accessories', tag: 'Handmade', rating: '4.6', badgeColor: '#06b6d4' },
  { id: 7, title: 'Smart Ambient Desk Light', price: '$79.00', category: 'Smart Home', tag: 'Popular', rating: '4.8', badgeColor: '#10b981' },
  { id: 8, title: 'Titanium Everyday Pen', price: '$55.00', category: 'Accessories', tag: 'Featured', rating: '4.9', badgeColor: '#f59e0b' },
];

/* ═══════════════════════════════════════════════════════════════ */

function GooeyFilter({ id, blur = 5 }: { id: string; blur?: number }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

export interface ResizableMarketplaceNavProps {
  topPlaceholder?: string;
  scrollThreshold?: number;
  className?: string;
}

export const ResizableMarketplaceNav: React.FC<ResizableMarketplaceNavProps> = ({
  topPlaceholder = 'Search curated marketplace products, brands, or categories…',
  scrollThreshold = 60,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const filterId = \`gooey-morph-\${uid}\`;

  const scrollRef   = useRef<HTMLDivElement>(null);
  const topInputRef = useRef<HTMLInputElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  /* ── State ── */
  const [isScrolled, setIsScrolled]           = useState(false);
  const [userRestoredDock, setUserRestoredDock] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Dock internal state
  const [activeNav, setActiveNav]             = useState<NavId | null>('home');
  const [activePopover, setActivePopover]     = useState<PopoverId | null>(null);
  const [sortBy, setSortBy]                   = useState('latest');
  const [expiryStatus, setExpiryStatus]       = useState('all');
  const [minPrice, setMinPrice]               = useState('');
  const [maxPrice, setMaxPrice]               = useState('');
  const [panelHeight, setPanelHeight]         = useState(0);
  const [searchText, setSearchText]           = useState('');

  // Top bar
  const [topSearchText, setTopSearchText]     = useState('');
  const [cartCount]                           = useState(2);
  const [notifCount]                          = useState(4);

  /* ── Derived mode ── */
  const showDock = !isScrolled || userRestoredDock;
  const mode: Mode = showDock ? 'dock' : isSearchExpanded ? 'expanded' : 'collapsed';

  /* ── Scroll handler ── */
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const y = scrollRef.current.scrollTop;
    if (y > scrollThreshold) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
      setUserRestoredDock(false);
      setIsSearchExpanded(false);
    }
  }, [scrollThreshold]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setIsScrolled(false);
    setUserRestoredDock(false);
    setIsSearchExpanded(false);
  };

  /* ── Dock click handlers ── */
  const handleDockClick = (id: DockId) => {
    if (id === 'search') {
      // From dock mode, go to search
      setIsScrolled(true);
      setUserRestoredDock(false);
      setIsSearchExpanded(true);
      setActivePopover(null);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    if (id === 'filter' || id === 'more') {
      setActivePopover(prev => prev === id ? null : id);
    } else {
      setActiveNav(prev => prev === (id as NavId) ? null : (id as NavId));
      setActivePopover(null);
    }
  };

  const handleExpandSearch = () => {
    setIsSearchExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapseSearch = () => {
    if (searchText) {
      setSearchText('');
      inputRef.current?.focus();
    } else {
      setIsSearchExpanded(false);
    }
  };

  const handleRestoreDock = () => {
    setUserRestoredDock(true);
    setIsSearchExpanded(false);
    setActivePopover(null);
  };

  /* ── Measure popover panel ── */
  useEffect(() => {
    if (!panelRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        if (e.target === panelRef.current) setPanelHeight(e.target.scrollHeight);
      }
    });
    obs.observe(panelRef.current);
    return () => obs.disconnect();
  }, [activePopover]);

  /* ── Compute dimensions for each mode ── */
  const hasPopover = mode === 'dock' && activePopover !== null;
  const anyDockActive = activeNav || activePopover;
  const dockW = anyDockActive ? 310 : 252;

  const pillWidth  = mode === 'dock' ? dockW : mode === 'collapsed' ? 115 : 200;
  const pillHeight = mode === 'dock' ? (hasPopover ? Math.max(panelHeight, 48) : 48) : 40;
  const pillRadius = mode === 'dock' ? 24 : 9999;
  const pillML     = mode === 'expanded' ? 50 : 0;
  const pillMR     = mode === 'collapsed' ? 50 : 0;

  /* ── Check if a dock button is active ── */
  const isActive = (id: DockId) => {
    if (activePopover) return activePopover === id;
    return activeNav === id;
  };

  return (
    <div className={\`\${styles.viewportFrame} \${className}\`}>
      {/* ═══ TOP NAVBAR ═══ */}
      <div className={styles.topNavWrap}>
        <motion.div
          className={styles.navBody}
          animate={{
            width: isScrolled ? '500px' : '96%',
            maxWidth: '1240px',
            y: isScrolled ? 6 : 0,
            boxShadow: isScrolled
              ? '0 12px 36px -8px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.12)'
              : '0 4px 20px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <div className={styles.logoGroup} onClick={scrollToTop}>
            <div className={styles.logoIconBox}><Store size={18} /></div>
            <span className={styles.logoText}>StudioMarket</span>
          </div>

          <AnimatePresence mode="wait">
            {!isScrolled ? (
              <motion.div key="search" className={styles.topSearchBar}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                <Search size={17} className={styles.topSearchIcon} onClick={() => topInputRef.current?.focus()} />
                <SmoothInput
                  ref={topInputRef}
                  value={topSearchText}
                  onChange={e => setTopSearchText(e.target.value)}
                  placeholder={topPlaceholder}
                  className={styles.topSearchInput}
                  isDockMode
                />
                <button type="button" className={styles.scanBtn} aria-label="Scan"><Scan size={16} /></button>
              </motion.div>
            ) : (
              <motion.div key="label" className={styles.scrolledIndicator}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <span className={styles.scrolledLabel}>Catalog Overview</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.rightActions}>
            <button type="button" className={styles.actionBtn} aria-label="Cart">
              <ShoppingCart size={17} strokeWidth={2.2} />
              {cartCount > 0 && <span className={styles.badgeDot} />}
            </button>
            <button type="button" className={styles.actionBtn} aria-label="Notifications">
              <Bell size={17} strokeWidth={2.2} />
              {notifCount > 0 && <span className={styles.badgeDot} />}
            </button>
            <div className={styles.avatar}><span>K</span></div>
          </div>
        </motion.div>
      </div>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div ref={scrollRef} onScroll={handleScroll} className={styles.scrollCanvas}>
        <div className={styles.heroSection}>
          <div className={styles.heroBadge}><span>⚡ Next.js 16 • Turbopack • Framer Motion</span></div>
          <h1 className={styles.heroTitle}>Unified Resizable Navbar &amp; Sticky Dock</h1>
          <p className={styles.heroSubtitle}>
            Scroll down to watch the top navbar resize and the bottom dock morph into a gooey search bar.
          </p>
          <div className={styles.scrollPill} onClick={() => scrollRef.current?.scrollBy({ top: 300, behavior: 'smooth' })}>
            <span>↓ Scroll down to trigger gooey morph</span>
          </div>
        </div>

        <div className={styles.grid}>
          {DUMMY_PRODUCTS.map(p => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTag} style={{ backgroundColor: \`\${p.badgeColor}20\`, color: p.badgeColor }}>{p.tag}</span>
                <span className={styles.cardRating}>★ {p.rating}</span>
              </div>
              <div className={styles.cardBody}><h3 className={styles.cardTitle}>{p.title}</h3><span className={styles.cardCat}>{p.category}</span></div>
              <div className={styles.cardFoot}><span className={styles.cardPrice}>{p.price}</span><button type="button" className={styles.cardBtn}>Add to Cart</button></div>
            </div>
          ))}
        </div>

        <div className={styles.extraZone}>
          <button type="button" className={styles.topBtn} onClick={scrollToTop}>
            <ArrowUp size={16} /><span>Scroll Back to Top &amp; Restore Full Dock</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           BOTTOM: SINGLE-LAYER GOOEY MORPH (matches GooeyInput architecture)
           ONE gooey-filtered wrapper. Pill = flex item with opaque bg surface.
           Bubbles = absolute-positioned. Text survives filter inside opaque surface.
         ═══════════════════════════════════════════════════════════════ */}
      <div className={styles.bottomAnchor}>
        <GooeyFilter id={filterId} blur={6} />

        <MotionConfig transition={GOOEY_SPRING}>
          {/* Single gooey-filtered wrapper (like GooeyInput's .filterWrap) */}
          <div className={styles.gooeyWrap} style={{ filter: \`url(#\${filterId})\` }}>

            {/* ── Main pill: flex item, animates width/margin ── */}
            <motion.div
              className={styles.pillRow}
              animate={{
                width: pillWidth,
                height: pillHeight,
                marginLeft: pillML,
                marginRight: pillMR,
              }}
            >
              <div className={styles.pillSurface} style={{ borderRadius: pillRadius }}>
                <AnimatePresence mode="wait" initial={false}>
                  {mode === 'dock' ? (
                    /* ─── DOCK CONTENT ─── */
                    <motion.div key="dock" className={styles.dockContent}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FAST_FADE}>

                      {/* Popover panel */}
                      <div ref={panelRef}>
                        <AnimatePresence mode="popLayout" initial={false}>
                          {activePopover && (
                            <motion.div key={activePopover} className={styles.panelWrap}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }} transition={GOOEY_SPRING}>

                              {activePopover === 'filter' && (
                                <div className={styles.popContent}>
                                  <div className={styles.filterTopRow}>
                                    <div className={styles.filterCol}>
                                      <span className={styles.secLabel}>Sort By</span>
                                      <div className={styles.optList}>
                                        {SORT_OPTIONS.map(o => (
                                          <button key={o.id} type="button" onClick={() => setSortBy(o.id)}
                                            className={\`\${styles.optBtn} \${sortBy === o.id ? styles.optActive : ''}\`}>
                                            <span className={styles.optDot} /><span>{o.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className={styles.filterDiv} />
                                    <div className={styles.filterCol}>
                                      <span className={styles.secLabel}>Expiry</span>
                                      <div className={styles.optList}>
                                        {EXPIRY_OPTIONS.map(o => (
                                          <button key={o.id} type="button" onClick={() => setExpiryStatus(o.id)}
                                            className={\`\${styles.optBtn} \${expiryStatus === o.id ? styles.optActive : ''}\`}>
                                            <span className={\`\${styles.optDot} \${styles[o.cls]}\`} /><span>{o.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className={styles.filterSec}>
                                    <span className={styles.secLabel}>Price Range</span>
                                    <div className={styles.priceRow}>
                                      <div className={styles.priceBox}>
                                        <span className={styles.priceSign}>$</span>
                                        <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className={styles.priceInput} />
                                      </div>
                                      <span className={styles.priceSep}>–</span>
                                      <div className={styles.priceBox}>
                                        <span className={styles.priceSign}>$</span>
                                        <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className={styles.priceInput} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activePopover === 'more' && (
                                <div className={styles.popContent}>
                                  {[
                                    { icon: <Info size={16} />, label: 'Service Guide' },
                                    { icon: <Building2 size={16} />, label: 'Seller Center' },
                                    { icon: <Tag size={16} />, label: 'Coupons & Perks' },
                                    { icon: <LifeBuoy size={16} />, label: 'Customer Support' },
                                  ].map(link => (
                                    <button key={link.label} type="button" className={styles.moreLink}>
                                      <div className={styles.moreLinkL}>{link.icon}<span>{link.label}</span></div>
                                      <ChevronRight size={14} className={styles.moreLinkArr} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Dock tab bar */}
                      <div className={styles.dockBar}>
                        <div className={styles.tabList} role="tablist">
                          {DOCK_BUTTONS.map(btn => {
                            const active = isActive(btn.id);
                            return (
                              <motion.button key={btn.id} type="button" role="tab" aria-selected={active}
                                initial={false}
                                animate={{ gap: active ? '0.45rem' : 0, paddingLeft: active ? '0.85rem' : '0.5rem', paddingRight: active ? '0.85rem' : '0.5rem' }}
                                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                                onClick={() => handleDockClick(btn.id)}
                                className={\`\${styles.tabBtn} \${active ? styles.tabActive : ''}\`}>
                                <span className={styles.iconSpan}>{btn.icon}</span>
                                <AnimatePresence initial={false}>
                                  {active && (
                                    <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }}
                                      exit={{ width: 0, opacity: 0 }} transition={LABEL_SPRING} className={styles.labelSpan}>
                                      {btn.label}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ) : mode === 'collapsed' ? (
                    /* ─── COLLAPSED SEARCH ─── */
                    <motion.button key="collapsed" type="button" className={styles.collapsedBtn}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FAST_FADE}
                      onClick={handleExpandSearch}>
                      <Search size={16} strokeWidth={2} />
                      <span className={styles.collapsedText}>Search…</span>
                    </motion.button>
                  ) : (
                    /* ─── EXPANDED SEARCH ─── */
                    <motion.div key="expanded" className={styles.expandedRow}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FAST_FADE}>
                      <SmoothInput ref={inputRef} value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') handleCollapseSearch(); }}
                        placeholder="Search products…" className={styles.searchInput}
                        isDockMode />
                      <button type="button" className={styles.closeBtn} onClick={handleCollapseSearch} aria-label="Close">
                        <X size={14} strokeWidth={2.4} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ── Left bubble: search icon (absolute, like GooeyInput .bubble) ── */}
            <motion.div
              className={styles.bubble}
              style={{ left: 0 }}
              animate={{
                scale: mode === 'expanded' ? 1 : 0,
                opacity: mode === 'expanded' ? 1 : 0,
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <div className={styles.bubbleSurface}>
                <Search size={16} strokeWidth={2} />
              </div>
            </motion.div>

            {/* ── Right bubble: dock restore (absolute, right side) ── */}
            <motion.div
              className={styles.bubble}
              style={{ right: 0 }}
              animate={{
                scale: mode === 'collapsed' ? 1 : 0,
                opacity: mode === 'collapsed' ? 1 : 0,
              }}
              onClick={handleRestoreDock}
              title="Restore Dock"
            >
              <div className={styles.bubbleSurface}>
                <Grip size={18} strokeWidth={2.2} />
              </div>
            </motion.div>

          </div>
        </MotionConfig>
      </div>
    </div>
  );
};

export default ResizableMarketplaceNav;
`;

export const FULL_RESIZABLE_NAV_SCSS = `@use "../../../styles/variables.scss" as *;

/* ═══ VIEWPORT FRAME ═══ */
.viewportFrame {
  position: relative;
  width: 100%;
  height: calc(100vh - 240px);
  min-height: 520px;
  max-height: 680px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #090d16;
  color: #f8fafc;
  box-shadow: 0 24px 60px -15px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08);
  :global([data-theme='light']) & { background: #f8fafc; color: #0f172a; box-shadow: 0 24px 60px -15px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.08); }
}

/* ═══ TOP NAVBAR ═══ */
.topNavWrap { position: absolute; top: 14px; left: 0; right: 0; z-index: 50; display: flex; justify-content: center; pointer-events: none; }

.navBody {
  pointer-events: auto; display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 14px; border-radius: 9999px;
  background: rgba(18,24,38,0.88); backdrop-filter: blur(16px); gap: 12px; box-sizing: border-box;
  :global([data-theme='light']) & { background: rgba(255,255,255,0.92); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.08) !important; }
}

.logoGroup { display: flex; align-items: center; gap: 8px; flex-shrink: 0; cursor: pointer; &:hover { transform: scale(1.02); } }
.logoIconBox { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#3b82f6,#6366f1); color: #fff; }
.logoText { font-size: 0.95rem; font-weight: 700; letter-spacing: -0.02em; }

.topSearchBar {
  flex: 1; max-width: 580px; height: 38px; display: flex; align-items: center; padding: 0 12px;
  border-radius: 9999px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); gap: 8px;
  :global([data-theme='light']) & { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); }
  &:focus-within { border-color: #3b82f6; background: rgba(0,0,0,0.45); :global([data-theme='light']) & { background: #fff; } }
  :global(.smoothCaret), [class*="smoothCaret"] { box-shadow: none !important; }
}
.topSearchIcon { color: #94a3b8; flex-shrink: 0; cursor: pointer; }
.topSearchInput { flex: 1; min-width: 0; background: transparent; border: none; outline: none; font-family: inherit; font-size: 0.85rem; color: inherit; &::placeholder { color: #64748b; font-size: 0.82rem; } }
.scanBtn { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 6px; &:hover { color: #fff; } }
.scrolledIndicator { display: flex; align-items: center; justify-content: center; }
.scrolledLabel { font-size: 0.82rem; font-weight: 600; color: #94a3b8; }

.rightActions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.actionBtn {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; cursor: pointer;
  transition: background 0.15s, transform 0.15s, color 0.15s;
  :global([data-theme='light']) & { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.08); color: #334155; }
  &:hover { background: rgba(255,255,255,0.12); color: #fff; transform: translateY(-1px); }
}
.badgeDot { position: absolute; top: 7px; right: 7px; width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }
.avatar { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: #2563eb; color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer; box-shadow: 0 2px 10px rgba(37,99,235,0.4); &:hover { transform: scale(1.06); } }

/* ═══ SCROLLABLE CANVAS ═══ */
.scrollCanvas { flex: 1; width: 100%; overflow-y: auto; padding: 85px 24px 110px; box-sizing: border-box; scroll-behavior: smooth; &::-webkit-scrollbar { width: 6px; } &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; } }

.heroSection { text-align: center; max-width: 680px; margin: 16px auto 36px; display: flex; flex-direction: column; align-items: center; }
.heroBadge { display: inline-flex; padding: 4px 12px; border-radius: 9999px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; font-size: 0.76rem; font-weight: 600; margin-bottom: 14px; }
.heroTitle { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 10px; background: linear-gradient(135deg,#fff 40%,#94a3b8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; :global([data-theme='light']) & { background: linear-gradient(135deg,#0f172a 40%,#475569); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; } }
.heroSubtitle { font-size: 0.92rem; line-height: 1.6; color: #94a3b8; margin: 0 0 18px; :global([data-theme='light']) & { color: #475569; } }
.scrollPill { display: inline-flex; align-items: center; padding: 7px 16px; border-radius: 9999px; background: rgba(255,255,255,0.06); border: 1px dashed rgba(255,255,255,0.18); font-size: 0.8rem; font-weight: 500; color: #94a3b8; cursor: pointer; &:hover { background: rgba(255,255,255,0.1); border-color: #3b82f6; } }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; max-width: 1040px; margin: 0 auto; }
.card { background: rgba(18,24,38,0.6); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; :global([data-theme='light']) & { background: #fff; border-color: rgba(0,0,0,0.08); } &:hover { transform: translateY(-3px); border-color: rgba(59,130,246,0.4); box-shadow: 0 12px 28px -6px rgba(0,0,0,0.4); } }
.cardHead { display: flex; align-items: center; justify-content: space-between; }
.cardTag { font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.cardRating { font-size: 0.78rem; font-weight: 600; color: #fbbf24; }
.cardBody { display: flex; flex-direction: column; gap: 4px; }
.cardTitle { font-size: 0.95rem; font-weight: 600; margin: 0; }
.cardCat { font-size: 0.78rem; color: #64748b; }
.cardFoot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); :global([data-theme='light']) & { border-top-color: rgba(0,0,0,0.06); } }
.cardPrice { font-size: 1.05rem; font-weight: 700; color: #3b82f6; }
.cardBtn { font-size: 0.78rem; font-weight: 600; padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: inherit; cursor: pointer; &:hover { background: #3b82f6; color: #fff; } }

.extraZone { text-align: center; padding: 40px 0 30px; display: flex; justify-content: center; }
.topBtn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 9999px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.35); color: #60a5fa; font-size: 0.85rem; font-weight: 600; cursor: pointer; &:hover { background: #3b82f6; color: #fff; transform: translateY(-2px); } }

/* ═══════════════════════════════════════════════════════════════
   BOTTOM MORPHING DOCK/SEARCH — Dual-Layer Gooey Architecture
   Layer 1 (bgLayer): solid shapes with SVG gooey filter → liquid bridges
   Layer 2 (fgLayer): crisp text & icons, no filter
   ═══════════════════════════════════════════════════════════════ */
.bottomAnchor {
  position: absolute;
  bottom: 18px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  pointer-events: none;
  z-index: 60;
}

/* ── Single gooey-filtered wrapper (like GooeyInput .filterWrap) ── */
.gooeyWrap {
  position: relative;
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

/* ── Main pill: flex item, animates width/margin ── */
.pillRow {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
}

/* The opaque surface inside the pill — text survives gooey filter because
   the background is fully opaque, so feComposite(atop) preserves interior content */
.pillSurface {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #eef1f6;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1), 0 16px 40px -10px rgba(0,0,0,0.1);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
  :global([data-theme='dark']) & {
    background: #252d3f;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 20px 50px -12px rgba(0,0,0,0.6);
  }
}

/* ── Absolute-positioned bubble (like GooeyInput .bubble) ── */
.bubble {
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.bubbleSurface {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #eef1f6;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1), 0 16px 40px -10px rgba(0,0,0,0.1);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
  :global([data-theme='dark']) & {
    background: #252d3f;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 20px 50px -12px rgba(0,0,0,0.6);
  }
  &:hover { transform: scale(1.05); }
  &:active { transform: scale(0.95); }
}

/* ── Dock Content (rendered inside pill surface) ── */
.dockContent { display: flex; flex-direction: column; width: 100%; height: 100%; position: relative; }
.panelWrap { padding: 14px 14px 56px; box-sizing: border-box; width: 100%; }
.popContent { display: flex; flex-direction: column; gap: 12px; }

.filterTopRow { display: flex; gap: 0; align-items: flex-start; }
.filterCol { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.filterDiv { width: 1px; background: rgba(0,0,0,0.08); align-self: stretch; margin: 0 10px; flex-shrink: 0; :global([data-theme='dark']) & { background: rgba(255,255,255,0.08); } }
.filterSec { display: flex; flex-direction: column; gap: 5px; }
.secLabel { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #64748b; padding: 0 2px; margin-bottom: 2px; :global([data-theme='dark']) & { color: rgba(255,255,255,0.32); } }

.optList { display: flex; flex-direction: column; gap: 1px; }
.optBtn {
  display: flex; align-items: center; gap: 7px; width: 100%;
  padding: 5px 7px; border-radius: 8px; border: none; background: transparent;
  color: #475569; font-size: 0.77rem; font-weight: 500; cursor: pointer; text-align: left;
  transition: background 0.13s, color 0.13s;
  :global([data-theme='dark']) & { color: rgba(255,255,255,0.45); }
  &:hover { background: rgba(0,0,0,0.04); color: #0f172a; :global([data-theme='dark']) & { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); } }
}
.optActive { background: rgba(99,102,241,0.1) !important; color: #4f46e5 !important; font-weight: 600; :global([data-theme='dark']) & { background: rgba(255,255,255,0.1) !important; color: #fff !important; } .optDot { opacity: 1; } }
.optDot { width: 5px; height: 5px; border-radius: 50%; background: #6366f1; flex-shrink: 0; opacity: 0; transition: opacity 0.13s; :global([data-theme='dark']) & { background: rgba(255,255,255,0.5); } }
.dotAll { background: #64748b; }
.dotNormal { background: #10b981; }
.dotWarning { background: #f59e0b; }
.dotCritical { background: #f97316; }
.dotExpired { background: #ef4444; }

.priceRow { display: flex; align-items: center; gap: 8px; width: 100%; }
.priceBox { flex: 1; display: flex; align-items: center; gap: 5px; height: 36px; background: #f1f5f9; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 0 10px; min-width: 0; :global([data-theme='dark']) & { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); } &:focus-within { border-color: #6366f1; } }
.priceSign { font-size: 0.8rem; font-weight: 700; color: #64748b; flex-shrink: 0; :global([data-theme='dark']) & { color: rgba(255,255,255,0.5); } }
.priceInput { flex: 1; min-width: 0; width: 100%; height: 100%; background: transparent; border: none; outline: none; font-size: 0.82rem; font-weight: 500; color: #0f172a; padding: 0; :global([data-theme='dark']) & { color: #fff; } &::placeholder { color: #94a3b8; :global([data-theme='dark']) & { color: rgba(255,255,255,0.28); } } &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance: none; } }
.priceSep { font-size: 0.8rem; font-weight: 500; color: #94a3b8; flex-shrink: 0; }

.moreLink {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 11px; border: none; background: transparent;
  color: #334155; font-size: 0.84rem; font-weight: 500; cursor: pointer; width: 100%; text-align: left;
  transition: background 0.15s, color 0.15s;
  :global([data-theme='dark']) & { color: rgba(255,255,255,0.7); }
  &:hover { background: rgba(0,0,0,0.04); color: #0f172a; :global([data-theme='dark']) & { background: rgba(255,255,255,0.08); color: #fff; } }
}
.moreLinkL { display: flex; align-items: center; gap: 9px; svg { color: #64748b; :global([data-theme='dark']) & { color: rgba(255,255,255,0.45); } } }
.moreLinkArr { opacity: 0.4; transition: opacity 0.15s, transform 0.15s; .moreLink:hover & { opacity: 1; transform: translateX(2px); } }

/* Dock bar */
.dockBar { position: absolute; bottom: 0; left: 0; width: 100%; height: 48px; display: flex; align-items: center; }
.tabList { display: flex; height: 100%; width: 100%; align-items: center; justify-content: space-between; padding: 0 6px; box-sizing: border-box; }
.tabBtn {
  position: relative; display: flex; padding: 0; height: 36px; min-width: 36px;
  align-items: center; justify-content: center; border-radius: 10px;
  background: transparent; border: none; color: #64748b; cursor: pointer; outline: none;
  font-size: 0.82rem; font-weight: 500; white-space: nowrap; user-select: none; flex-shrink: 0;
  transition: background 0.18s, color 0.18s;
  :global([data-theme='dark']) & { color: rgba(255,255,255,0.42); }
  &:first-of-type { border-radius: 18px 10px 10px 18px; }
  &:last-of-type { border-radius: 10px 18px 18px 10px; }
  &:hover:not(.tabActive) { background: rgba(0,0,0,0.05); color: #0f172a; :global([data-theme='dark']) & { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); } }
}
.tabActive { background: rgba(99,102,241,0.12); color: #4f46e5; font-weight: 600; :global([data-theme='dark']) & { background: rgba(255,255,255,0.1); color: #fff; } }
.iconSpan { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.labelSpan { overflow: hidden; white-space: nowrap; font-weight: 500; letter-spacing: -0.01em; }

/* ── Collapsed Search ── */
.collapsedBtn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 100%; background: transparent; border: none; color: inherit; cursor: pointer; padding: 0 16px; border-radius: 9999px; font-family: inherit; }
.collapsedText { font-size: 0.875rem; font-weight: 500; white-space: nowrap; }

/* ── Expanded Search ── */
.expandedRow {
  display: flex; align-items: center; width: 100%; height: 100%; padding: 0 8px 0 14px; gap: 6px; box-sizing: border-box;
  /* Remove caret shadow per design requirement */
  :global(.smoothCaret), [class*="smoothCaret"] { box-shadow: none !important; }
}
.searchInput {
  flex: 1; min-width: 0; background: transparent; border: none; outline: none;
  font-family: inherit; font-size: 0.875rem; color: inherit;
  &::placeholder { color: rgba(15,23,42,0.45); :global([data-theme='dark']) & { color: rgba(255,255,255,0.4); } }
  &::-webkit-search-cancel-button { display: none; }
}
.closeBtn {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 9999px; border: none;
  background: rgba(0,0,0,0.08); color: inherit; cursor: pointer; padding: 0; flex-shrink: 0;
  transition: background 0.15s, transform 0.15s;
  :global([data-theme='dark']) & { background: rgba(255,255,255,0.12); }
  &:hover { background: rgba(0,0,0,0.16); transform: scale(1.1); :global([data-theme='dark']) & { background: rgba(255,255,255,0.2); } }
  &:active { transform: scale(0.9); }
}
`;

export const FULL_VERTICAL_TOOLTIP_TSX = `'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { motion, useSpring, useMotionTemplate } from 'framer-motion';
import { MessageCircle, Share2, Menu, Command } from 'lucide-react';
import styles from './VerticalTooltipMenu.module.scss';

export interface TooltipMenuItem {
  id: string;
  icon: ReactNode;
  label: string;
  shortcut?: (string | ReactNode)[];
  hasBadge?: boolean;
  onClick?: () => void;
}

export type TooltipSide = 'right' | 'left' | 'top' | 'bottom';

export interface SpringConfig {
  type?: 'spring';
  stiffness?: number;
  damping?: number;
  mass?: number;
}

interface VtooltipContextType {
  iconRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  tooltipRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  tooltipParentRef: React.RefObject<HTMLDivElement | null>;
  tooltipPosition: any;
  clipPathTop: any;
  clipPathBottom: any;
  opacity: any;
  side: TooltipSide;
  onMouseEnterOnIcon: (e: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  setIconRef: (index: number, el: HTMLElement | null) => void;
  setTooltipRef: (index: number, el: HTMLElement | null) => void;
  registerContent: (index: number, content: ReactNode) => void;
  activeItemIndex: number | null;
}

const VtooltipContext = createContext<VtooltipContextType | null>(null);

export const useVtooltip = () => {
  const ctx = useContext(VtooltipContext);
  if (!ctx) {
    throw new Error('Vtooltip components must be used within VtooltipRoot');
  }
  return ctx;
};

/* ── 1. VtooltipRoot: orchestrates springs & clip-path calculation ── */
export interface VtooltipRootProps {
  children: ReactNode;
  items?: TooltipMenuItem[];
  side?: TooltipSide;
  springConfig?: SpringConfig;
  className?: string;
  onActiveChange?: (index: number) => void;
}

export const VtooltipRoot: React.FC<VtooltipRootProps> = ({
  children,
  items: directItems,
  side = 'right', // Tooltip on the RIGHT side by default as requested
  springConfig = { stiffness: 400, damping: 30, mass: 0.8 },
  className = '',
}) => {
  const iconRefs = useRef<(HTMLElement | null)[]>([]);
  const tooltipRefs = useRef<(HTMLElement | null)[]>([]);
  const tooltipParentRef = useRef<HTMLDivElement | null>(null);
  const registeredContentsRef = useRef<Map<number, ReactNode>>(new Map());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Motion spring values
  const tooltipPosition = useSpring(0, { stiffness: 350, damping: 30 });
  const clipPathTop = useSpring(0, springConfig);
  const clipPathBottom = useSpring(79, springConfig);
  const opacity = useSpring(0, { stiffness: 320, damping: 28, mass: 0.8 });

  const totalItemsCount = directItems ? directItems.length : registeredContentsRef.current.size;

  const calculateClipPath = useCallback(
    (index: number | null) => {
      if (index === null) {
        clipPathTop.set(0);
        clipPathBottom.set(0);
        opacity.set(0);
        return;
      }

      const isVertical = side === 'left' || side === 'right';
      const itemsList = tooltipRefs.current;
      const count = totalItemsCount;

      if (isVertical) {
        let topSum = 0;
        for (let r = 0; r < index; r++) {
          topSum += itemsList[r]?.getBoundingClientRect().height || 36;
        }

        let bottomSum = 0;
        for (let t = index + 1; t < count; t++) {
          bottomSum += itemsList[t]?.getBoundingClientRect().height || 36;
        }

        const totalH = itemsList.slice(0, count).reduce(
          (acc, el) => acc + (el?.getBoundingClientRect().height || 36),
          0
        );

        const topPercent = totalH > 0 ? (topSum / totalH) * 100 : 0;
        const bottomPercent = totalH > 0 ? (bottomSum / totalH) * 100 : 0;

        clipPathTop.set(topPercent);
        clipPathBottom.set(bottomPercent);
      } else {
        let leftSum = 0;
        for (let r = 0; r < index; r++) {
          leftSum += itemsList[r]?.getBoundingClientRect().width || 60;
        }

        let rightSum = 0;
        for (let t = index + 1; t < count; t++) {
          rightSum += itemsList[t]?.getBoundingClientRect().width || 60;
        }

        const totalW = itemsList.slice(0, count).reduce(
          (acc, el) => acc + (el?.getBoundingClientRect().width || 60),
          0
        );

        const leftPercent = totalW > 0 ? (leftSum / totalW) * 100 : 0;
        const rightPercent = totalW > 0 ? (rightSum / totalW) * 100 : 0;

        clipPathTop.set(leftPercent);
        clipPathBottom.set(rightPercent);
      }

      opacity.set(1);
    },
    [side, totalItemsCount, clipPathTop, clipPathBottom, opacity]
  );

  const onMouseEnterOnIcon = useCallback(
    (_e: React.MouseEvent, index: number) => {
      setActiveItemIndex(index);
      const iconRect = iconRefs.current[index]?.getBoundingClientRect();
      const tooltipItemRect = tooltipRefs.current[index]?.getBoundingClientRect();
      const parentRect = tooltipParentRef.current?.getBoundingClientRect();

      if (iconRect && tooltipItemRect && parentRect) {
        const isVertical = side === 'left' || side === 'right';

        if (isVertical) {
          let offsetBefore = 0;
          for (let r = 0; r < index; r++) {
            offsetBefore += tooltipRefs.current[r]?.getBoundingClientRect().height || 36;
          }
          const iconCenterY = iconRect.top + iconRect.height / 2;
          const tooltipItemH = tooltipItemRect.height || 36;
          const tooltipCenterY = parentRect.top + offsetBefore + tooltipItemH / 2;
          tooltipPosition.set(iconCenterY - tooltipCenterY);
        } else {
          let offsetBefore = 0;
          for (let r = 0; r < index; r++) {
            offsetBefore += tooltipRefs.current[r]?.getBoundingClientRect().width || 60;
          }
          const iconCenterX = iconRect.left + iconRect.width / 2;
          const tooltipItemW = tooltipItemRect.width || 60;
          const tooltipCenterX = parentRect.left + offsetBefore + tooltipItemW / 2;
          tooltipPosition.set(iconCenterX - tooltipCenterX);
        }
      }

      calculateClipPath(index);
    },
    [side, tooltipPosition, calculateClipPath]
  );

  const onMouseLeave = useCallback(() => {
    setActiveItemIndex(null);
    opacity.set(0);
  }, [opacity]);

  const setIconRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) iconRefs.current[index] = el;
  }, []);

  const setTooltipRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) tooltipRefs.current[index] = el;
  }, []);

  const registerContent = useCallback((index: number, content: ReactNode) => {
    if (registeredContentsRef.current.get(index) !== content) {
      registeredContentsRef.current.set(index, content);
      forceUpdate();
    }
  }, []);

  const isVertical = side === 'left' || side === 'right';

  // Dynamic template for spring-based clip-path animation
  const verticalClipPath = useMotionTemplate\`inset(\${clipPathTop}% 0% \${clipPathBottom}% 0% round 10px)\`;
  const horizontalClipPath = useMotionTemplate\`inset(0% \${clipPathBottom}% 0% \${clipPathTop}% round 10px)\`;

  const sideClass =
    side === 'right'
      ? styles.sideRight
      : side === 'left'
      ? styles.sideLeft
      : side === 'top'
      ? styles.sideTop
      : styles.sideBottom;

  // Tooltip content items
  const renderedTooltips = directItems
    ? directItems.map((item, idx) => ({
        idx,
        content: (
          <div className={styles.tooltipContent}>
            <span className={styles.tooltipLabel}>{item.label}</span>
            {item.shortcut && item.shortcut.length > 0 && (
              <span className={styles.shortcutGroup}>
                {item.shortcut.map((key, kIdx) => (
                  <kbd key={kIdx} className={styles.keyCap}>
                    {key}
                  </kbd>
                ))}
              </span>
            )}
          </div>
        ),
      }))
    : Array.from(registeredContentsRef.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([idx, content]) => ({ idx, content }));

  return (
    <VtooltipContext.Provider
      value={{
        iconRefs,
        tooltipRefs,
        tooltipParentRef,
        tooltipPosition,
        clipPathTop,
        clipPathBottom,
        opacity,
        side,
        onMouseEnterOnIcon,
        onMouseLeave,
        setIconRef,
        setTooltipRef,
        registerContent,
        activeItemIndex,
      }}
    >
      <div className={\`\${styles.wrapper} \${className}\`}>
        {/* Tooltip Floating Card Container */}
        <div ref={tooltipParentRef} className={\`\${styles.tooltipParent} \${sideClass}\`}>
          <motion.div
            className={\`\${styles.tooltipContainer} \${
              isVertical ? styles.verticalFlow : styles.horizontalFlow
            }\`}
            style={
              isVertical
                ? {
                    opacity,
                    y: tooltipPosition,
                    clipPath: verticalClipPath,
                  }
                : {
                    opacity,
                    x: tooltipPosition,
                    clipPath: horizontalClipPath,
                  }
            }
          >
            {renderedTooltips.map(({ idx, content }) => (
              <div
                key={idx}
                ref={(el) => setTooltipRef(idx, el)}
                className={\`\${styles.tooltipItem} \${
                  isVertical ? '' : styles.horizontalItem
                }\`}
              >
                {content}
              </div>
            ))}
          </motion.div>
        </div>

        {children}
      </div>
    </VtooltipContext.Provider>
  );
};

/* ── 2. VtooltipItem: links trigger and content at given index ── */
export interface VtooltipItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const VtooltipItem: React.FC<VtooltipItemProps> = ({
  children,
  index,
  className = '',
}) => {
  const { registerContent } = useVtooltip();
  const contentRef = useRef<ReactNode>(null);

  useEffect(() => {
    let contentElement: ReactNode = null;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<{ children?: ReactNode }>(child) && child.type === VtooltipContent) {
        contentElement = child.props.children;
      }
    });

    if (contentElement && contentRef.current !== contentElement) {
      contentRef.current = contentElement;
      registerContent(index, contentElement);
    }
  }, [children, index, registerContent]);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<{ children?: ReactNode }>(child) && child.type === VtooltipTrigger) {
          return <VtooltipTriggerButton index={index}>{child.props.children}</VtooltipTriggerButton>;
        }
        return null;
      })}
    </div>
  );
};

/* ── 3. VtooltipTrigger & Content primitives ── */
export const VtooltipTrigger: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const VtooltipContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
}) => {
  return <>{children}</>;
};

const VtooltipTriggerButton: React.FC<{ index: number; children: ReactNode }> = ({
  index,
  children,
}) => {
  const { onMouseEnterOnIcon, onMouseLeave, setIconRef } = useVtooltip();

  return (
    <div
      ref={(el) => setIconRef(index, el)}
      onMouseEnter={(e) => onMouseEnterOnIcon(e, index)}
      onMouseLeave={onMouseLeave}
      style={{ display: 'inline-flex' }}
    >
      {children}
    </div>
  );
};

/* ── 4. Full Turnkey Component: VerticalTooltipMenu ── */
export interface VerticalTooltipMenuProps {
  items?: TooltipMenuItem[];
  side?: TooltipSide;
  activeId?: string;
  defaultActiveId?: string;
  onSelect?: (id: string) => void;
  springConfig?: SpringConfig;
  className?: string;
}

export const DEFAULT_SKIPER98_ITEMS: TooltipMenuItem[] = [
  {
    id: 'comment',
    label: 'Comment',
    icon: <MessageCircle size={18} />,
    shortcut: ['C'],
    hasBadge: false,
  },
  {
    id: 'share',
    label: 'Share',
    icon: <Share2 size={18} />,
    hasBadge: false,
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: <Menu size={18} />,
    shortcut: [<Command key="cmd" size={11} />, 'K'],
    hasBadge: true,
  },
];

export const VerticalTooltipMenu: React.FC<VerticalTooltipMenuProps> = ({
  items = DEFAULT_SKIPER98_ITEMS,
  side = 'right', // User explicitly requested tooltip on RIGHT side
  activeId,
  defaultActiveId = 'menu',
  onSelect,
  springConfig = { stiffness: 400, damping: 30, mass: 0.8 },
  className = '',
}) => {
  const [selectedId, setSelectedId] = useState<string>(defaultActiveId);
  const currentActiveId = activeId !== undefined ? activeId : selectedId;

  const handleItemClick = (item: TooltipMenuItem) => {
    setSelectedId(item.id);
    if (onSelect) onSelect(item.id);
    if (item.onClick) item.onClick();
  };

  return (
    <VtooltipRoot items={items} side={side} springConfig={springConfig} className={className}>
      <NavContent
        items={items}
        currentActiveId={currentActiveId}
        handleItemClick={handleItemClick}
      />
    </VtooltipRoot>
  );
};

const NavContent: React.FC<{
  items: TooltipMenuItem[];
  currentActiveId: string;
  handleItemClick: (item: TooltipMenuItem) => void;
}> = ({ items, currentActiveId, handleItemClick }) => {
  const { onMouseLeave } = useVtooltip();

  return (
    <nav
      aria-label="Vertical navigation dock"
      className={styles.dock}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, idx) => {
        const isSelected = currentActiveId === item.id;
        const showBadge = item.hasBadge || isSelected;

        return (
          <VtooltipItem key={item.id} index={idx}>
            <VtooltipTrigger>
              <button
                type="button"
                className={styles.itemBtn}
                onClick={() => handleItemClick(item)}
                aria-label={item.label}
                aria-current={isSelected ? 'page' : undefined}
              >
                <span className={styles.itemIconWrapper}>
                  {item.icon}
                  {showBadge && <span className={styles.badge} aria-hidden="true" />}
                </span>
                <span className={styles.srOnly}>{item.label}</span>
              </button>
            </VtooltipTrigger>
          </VtooltipItem>
        );
      })}
    </nav>
  );
};

export default VerticalTooltipMenu;
`;

export const FULL_VERTICAL_TOOLTIP_SCSS = `/* VerticalTooltipMenu Styles - Skiper UI 98 Recreation */

.wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* ── Floating Menu Dock Pill ── */
.dock {
  z-index: 10;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
  gap: 4px;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  box-shadow: 
    0 16px 36px -8px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  :global([data-theme='dark']) & {
    background: #09090b;
    box-shadow: 
      0 20px 45px -10px rgba(0, 0, 0, 0.8),
      0 0 0 1px rgba(255, 255, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
}

/* ── Item Button ── */
.itemBtn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  transition: background-color 0.15s ease, transform 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active {
    transform: scale(0.92);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px #38bdf8;
  }
}

.itemIconWrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  svg {
    width: 100%;
    height: 100%;
    stroke-width: 2;
    transition: transform 0.15s ease;
  }
}

/* ── Active / Notification Badge (Cyan Dot) ── */
.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #38bdf8;
  border: 1.8px solid #000000;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
  pointer-events: none;
  transition: border-color 0.15s ease;

  .itemBtn:hover & {
    border-color: #27272a;
  }
}

/* ── Tooltip Parent Wrapper ── */
.tooltipParent {
  position: absolute;
  pointer-events: none;
  z-index: 20;

  /* Tooltip on the RIGHT side by default as requested */
  &.sideRight {
    left: calc(100% + 14px);
    top: 0;
  }

  &.sideLeft {
    right: calc(100% + 14px);
    top: 0;
  }

  &.sideTop {
    bottom: calc(100% + 14px);
    left: 0;
  }

  &.sideBottom {
    top: calc(100% + 14px);
    left: 0;
  }
}

/* ── Animated Tooltip Card Container (Clipped and Spring positioned) ── */
.tooltipContainer {
  background: #000000;
  color: #ffffff;
  border-radius: 10px;
  width: max-content;
  box-shadow: 
    0 12px 32px -6px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
  will-change: transform, clip-path, opacity;

  :global([data-theme='dark']) & {
    background: #111113;
    box-shadow: 
      0 16px 36px -6px rgba(0, 0, 0, 0.8),
      0 0 0 1px rgba(255, 255, 255, 0.15);
  }
}

.verticalFlow {
  display: flex;
  flex-direction: column;
}

.horizontalFlow {
  display: flex;
  flex-direction: row;
  height: 34px;
}

/* ── Tooltip Row Item ── */
.tooltipItem {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  box-sizing: border-box;
}

.tooltipContent {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1;
}

.tooltipLabel {
  color: #f4f4f5;
}

/* ── Keyboard Shortcut Badges ── */
.shortcutGroup {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.keyCap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 3.5px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: rgba(255, 255, 255, 0.95);
  font-family: inherit;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`;

export const FULL_NOTIFICATION_STACK_TSX = `'use client';

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
  ambient = false,
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
      className={\`\${styles.container} \${ambient ? styles.ambientWrap : ''} \${className}\`}
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
            aria-label={\`Show all \${activeCount} notifications\`}
            aria-expanded={false}
            aria-controls={id}
            className={styles.expandTrigger}
          />
        )}

        {/* Screen reader announcement */}
        <span aria-live="polite" className={styles.srOnly}>
          {isOpen ? \`Notifications expanded, \${activeCount} shown\` : 'Notifications collapsed'}
        </span>
      </div>
    </div>
  );
};

// Aliases for 1:1 compatibility with Motion UI and naming conventions
export const ListNotificationsStack = NotificationStack;
export default NotificationStack;
`;

export const FULL_NOTIFICATION_STACK_SCSS = `/* NotificationStack - 1:1 Motion UI Recreation */
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Inter:wght@400;500;600&display=swap');

.container {
  /* ── 1:1 Light Mode Design Tokens (Motion UI Eased Theme) ── */
  --ns-card-bg: #fbfaf7;
  --ns-card-border: rgba(0, 0, 0, 0.035);
  --ns-card-border-hover: rgba(0, 0, 0, 0.08);
  --ns-card-shadow: 0 12px 28px -6px rgba(120, 90, 60, 0.09), 0 4px 10px -2px rgba(0, 0, 0, 0.035), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --ns-card-shadow-hover: 0 14px 32px -6px rgba(120, 90, 60, 0.13), 0 6px 12px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --ns-title-color: #1c1917;
  --ns-body-color: #78716c;
  --ns-time-color: #78716c;
  --ns-icon-bg: #ede9e1;
  --ns-icon-color: #57534e;
  --ns-dot-bg: #1c1917;
  --ns-dot-shadow: none;
  --ns-header-title: #1a1a1a;
  --ns-header-btn: #6e6a64;
  --ns-header-btn-hover: #1a1a1a;
  --ns-ambient-bg: radial-gradient(130% 130% at 50% 0%, #fef6ed 0%, #fae4cc 42%, #f8d7b3 75%, #ebd0b2 100%);
  --ns-ambient-border: rgba(220, 190, 160, 0.4);
  --ns-ambient-shadow: 0 24px 48px -12px rgba(180, 130, 90, 0.25), 0 8px 16px -4px rgba(180, 130, 90, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 56px 24px;
  position: relative;
  user-select: none;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;

  *, *::before, *::after {
    box-sizing: border-box;
  }
}

/* ── 1:1 Dark Mode Design Tokens (Motion UI Velocity Dark Theme) ── */
:global([data-theme='dark']) .container:not([data-theme='light']),
.container[data-theme='dark'] {
  --ns-card-bg: #141718;
  --ns-card-border: rgba(255, 255, 255, 0.07);
  --ns-card-border-hover: rgba(255, 255, 255, 0.14);
  --ns-card-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.65), 0 4px 12px -2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --ns-card-shadow-hover: 0 18px 40px -8px rgba(0, 0, 0, 0.8), 0 6px 16px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.09);
  --ns-title-color: #ededec;
  --ns-body-color: #8b9391;
  --ns-time-color: #8b9391;
  --ns-icon-bg: rgba(255, 255, 255, 0.08);
  --ns-icon-color: #ededec;
  --ns-dot-bg: #34d399;
  --ns-dot-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
  --ns-header-title: #ededec;
  --ns-header-btn: #8b9391;
  --ns-header-btn-hover: #ededec;
  --ns-ambient-bg: radial-gradient(130% 130% at 50% 0%, #171e1f 0%, #101415 45%, #0b0d0e 80%, #07090a 100%);
  --ns-ambient-border: rgba(255, 255, 255, 0.08);
  --ns-ambient-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* ── 1:1 Motion UI Ambient Surface Frame ── */
.ambientWrap {
  border-radius: 24px;
  background: var(--ns-ambient-bg);
  border: 1px solid var(--ns-ambient-border);
  box-shadow: var(--ns-ambient-shadow);
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* ── Bounds Container ── */
.stackBox {
  position: relative;
  max-width: 100%;
}

/* ── Header ── */
.header {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 14px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transform-origin: bottom;
  pointer-events: auto;
  padding: 0 4px;
}

.headerTitle {
  margin: 0;
  font-family: 'Newsreader', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: -0.035em;
  line-height: 1;
  color: var(--ns-header-title);
  transition: color 0.2s ease;
}

.collapseButton {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 9999px;
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: var(--ns-header-btn);
  cursor: pointer;
  outline: none;
  transition: color 0.15s ease, opacity 0.15s ease;

  &:hover {
    color: var(--ns-header-btn-hover);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
  }

  svg {
    display: block;
    width: 13px;
    height: 13px;
    stroke-width: 2.2;
  }
}

/* ── Cards List Container ── */
.list {
  position: absolute;
  inset: 0;
  list-style: none;
  margin: 0;
  padding: 0;
}

.listItem {
  position: absolute;
  left: 0;
  right: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  will-change: transform, opacity;
  transform-origin: center center;
}

/* ── Notification Card (1:1 Motion UI pill-radius squircle) ── */
.card {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 28px;
  border: 1px solid var(--ns-card-border);
  background: var(--ns-card-bg);
  color: var(--ns-title-color);
  box-shadow: var(--ns-card-shadow);
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: var(--ns-card-border-hover);
    box-shadow: var(--ns-card-shadow-hover);
  }
}

/* ── Icon Box (Circle) ── */
.iconBox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--ns-icon-bg);
  color: var(--ns-icon-color);
  transition: background-color 0.2s ease, color 0.2s ease;

  svg {
    width: 19px;
    height: 19px;
    display: block;
    stroke-width: 1.8;
  }
}

/* ── Content Area ── */
.contentBox {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.cardTitle {
  margin: 0;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--ns-title-color);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.cardBody {
  margin: 0;
  font-size: 12.8px;
  line-height: 1.42;
  letter-spacing: -0.01em;
  color: var(--ns-body-color);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}

/* ── Trailing Column (Time & Unread Dot) ── */
.trailingBox {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  flex-shrink: 0;
  padding-top: 1px;
}

.timeText {
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--ns-time-color);
  line-height: 1;
  transition: color 0.2s ease;
}

.unreadDot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ns-dot-bg);
  box-shadow: var(--ns-dot-shadow);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

/* ── Transparent Stack Overlay Click Trigger ── */
.expandTrigger {
  position: absolute;
  inset: 0;
  z-index: 50;
  border: none;
  background: transparent;
  border-radius: 28px;
  cursor: pointer;
  outline: none;
  transition: box-shadow 0.2s ease;

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
  }
}

/* ── Screen-reader announcement ── */
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

export const FULL_FLIP_WORDS_TSX = `'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './FlipWords.module.scss';

export interface FlipWordsProps {
  /** Array of words or phrases to cycle through */
  words: string[];
  /** Duration in milliseconds that each word remains visible before flipping */
  duration?: number;
  /** Custom theme override: 'auto' | 'dark' | 'light' */
  theme?: 'auto' | 'dark' | 'light';
  /** Additional CSS class names */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

export const FlipWords: React.FC<FlipWordsProps> = ({
  words,
  duration = 2500,
  theme = 'auto',
  className = '',
  style,
}) => {
  const [currentWord, setCurrentWord] = useState<string>(words[0] || '');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Cycle to next word safely
  const startAnimation = useCallback(() => {
    if (!words || words.length === 0) return;
    const currentIndex = words.indexOf(currentWord);
    const nextIndex = (currentIndex + 1) % words.length;
    const nextWord = words[nextIndex] ?? words[0];
    setCurrentWord(nextWord);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating && words.length > 1) {
      const timer = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, startAnimation, words.length]);

  // Sync if words array changes externally
  useEffect(() => {
    if (words && words.length > 0 && !words.includes(currentWord)) {
      setCurrentWord(words[0]);
    }
  }, [words, currentWord]);

  const dataThemeAttr = theme === 'auto' ? undefined : theme;

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.span
        key={currentWord}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 12,
        }}
        exit={{
          opacity: 0,
          y: -24,
          x: 20,
          filter: 'blur(6px)',
          scale: 1.1,
          position: 'absolute',
          transition: {
            duration: 0.28,
            ease: 'easeInOut',
          },
        }}
        className={\`\${styles.flipWords} \${className}\`}
        data-theme={dataThemeAttr}
        style={style}
      >
        {currentWord.split(' ').map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: wordIndex * 0.15,
              duration: 0.25,
            }}
            className={styles.wordSpan}
          >
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: wordIndex * 0.15 + letterIndex * 0.035,
                  duration: 0.2,
                }}
                className={styles.letterSpan}
              >
                {letter}
              </motion.span>
            ))}
            <span className={styles.spaceSpan}>&nbsp;</span>
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  );
};
`;

export const FULL_FLIP_WORDS_SCSS = `/* FlipWords - 1:1 Aceternity UI Text Flipping Animation */

.flipWords {
  --fw-text-color: #09090b;
  
  display: inline-block;
  position: relative;
  text-align: left;
  padding: 0 0.25em;
  color: var(--fw-text-color);
  font-weight: 600;
  vertical-align: baseline;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
}

:global([data-theme='dark']) .flipWords,
.flipWords[data-theme='dark'] {
  --fw-text-color: #fafafa;
}

.wordSpan {
  display: inline-block;
  white-space: nowrap;
}

.letterSpan {
  display: inline-block;
  will-change: transform, opacity, filter;
}

.spaceSpan {
  display: inline-block;
}

/* ── Aceternity Demo Layout Styles ── */
.demoContainer {
  --demo-lead: #52525b;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  padding: 48px 16px;
  box-sizing: border-box;
}

:global([data-theme='dark']) .demoContainer {
  --demo-lead: #a1a1aa;
}

.demoHeading {
  margin: 0;
  font-size: clamp(1.75rem, 3.5vw, 2.25rem);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: -0.025em;
  color: var(--demo-lead);
  max-width: 800px;
}
`;
