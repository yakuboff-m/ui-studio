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
                <Search size={17} className={styles.topSearchIcon} />
                <input type="text" value={topSearchText} onChange={e => setTopSearchText(e.target.value)}
                  placeholder={topPlaceholder} className={styles.topSearchInput} />
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
                      <input ref={inputRef} type="search" value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') handleCollapseSearch(); }}
                        placeholder="Search products…" className={styles.searchInput} />
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
}
.topSearchIcon { color: #94a3b8; flex-shrink: 0; }
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
.heroTitle { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 10px; background: linear-gradient(135deg,#fff 40%,#94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; :global([data-theme='light']) & { background: linear-gradient(135deg,#0f172a 40%,#475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent; } }
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
  /* Match MarketplaceDock .container surface EXACTLY */
  background: #ffffff;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 16px 40px -10px rgba(0,0,0,0.12);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
  :global([data-theme='dark']) & {
    background: #1a1f2e;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px -12px rgba(0,0,0,0.7);
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
  /* Same surface as pill */
  background: #ffffff;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 16px 40px -10px rgba(0,0,0,0.12);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
  :global([data-theme='dark']) & {
    background: #1a1f2e;
    color: #f1f5f9;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 20px 50px -12px rgba(0,0,0,0.7);
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
.expandedRow { display: flex; align-items: center; width: 100%; height: 100%; padding: 0 8px 0 14px; gap: 6px; box-sizing: border-box; }
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
