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

export const FULL_SIDEBAR_TSX = `'use client';

import React, { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserCheck,
  CreditCard,
  ShoppingBag,
  BookOpen,
  Terminal,
  LifeBuoy,
  HeartHandshake,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import styles from './Sidebar.module.scss';

/* ─── Context & Types ─── */
export interface SidebarContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  collapsible: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export interface SidebarProviderProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  collapsible?: boolean;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  collapsible = false,
}) => {
  const [openState, setOpenState] = useState<boolean>(!collapsible);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, collapsible }}>
      {children}
    </SidebarContext.Provider>
  );
};

/* ─── Sidebar Root Container ─── */
export interface SidebarProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  collapsible?: boolean;
  className?: string;
  theme?: 'auto' | 'dark' | 'light';
  style?: React.CSSProperties;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  open,
  setOpen,
  animate = true,
  collapsible = false,
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate} collapsible={collapsible}>
      {children}
    </SidebarProvider>
  );
};

/* ─── Sidebar Body (Desktop + Mobile) ─── */
export interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const SidebarBody: React.FC<SidebarBodyProps> = ({ children, className = '', ...props }) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar className={className} {...props}>
        {children}
      </MobileSidebar>
    </>
  );
};

/* ─── Desktop Sidebar ─── */
export interface DesktopSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  className = '',
  children,
  ...props
}) => {
  const { open, setOpen, animate, collapsible } = useSidebar();

  const sidebarWidth = collapsible ? (open ? 280 : 68) : 280;

  return (
    <motion.aside
      className={\`\${styles.desktopSidebar} \${className}\`}
      animate={animate ? { width: sidebarWidth } : undefined}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      {...(props as any)}
    >
      {collapsible && (
        <button
          type="button"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className={styles.collapseToggleBtn}
          onClick={() => setOpen((prev) => !prev)}
        >
          <motion.div
            animate={{ rotate: open ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={14} />
          </motion.div>
        </button>
      )}
      {children}
    </motion.aside>
  );
};

/* ─── Mobile Sidebar ─── */
export interface MobileSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  className = '',
  children,
  ...props
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className={styles.mobileBar} {...props}>
        <div className={styles.logo}>
          <div className={styles.logoMark} />
          <span className={styles.logoText}>Acet Labs</span>
        </div>
        <button
          type="button"
          aria-label="Open mobile menu"
          className={styles.mobileMenuBtn}
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className={\`\${styles.mobileDrawer} \${className}\`}
          >
            <button
              type="button"
              aria-label="Close mobile menu"
              className={styles.mobileCloseBtn}
              onClick={() => setMobileOpen(false)}
            >
              <X size={20} />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Sidebar Link with Floating Hover Pill ─── */
export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SidebarLinkProps {
  link: SidebarLinkItem;
  id?: string;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  className?: string;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({
  link,
  id,
  activeId,
  onHover,
  className = '',
}) => {
  const { open } = useSidebar();
  const [isLocalHovered, setIsLocalHovered] = useState(false);

  const isHighlighted = activeId !== undefined ? activeId === id : isLocalHovered;

  return (
    <a
      href={link.href}
      className={\`\${styles.sidebarLink} \${className}\`}
      onMouseEnter={() => {
        setIsLocalHovered(true);
        if (id && onHover) onHover(id);
      }}
      onMouseLeave={() => {
        setIsLocalHovered(false);
        if (onHover) onHover(null);
      }}
    >
      {isHighlighted && (
        <motion.div
          layoutId="hovered-sidebar-link"
          className={styles.hoverPill}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <div className={styles.linkContent}>
        <span className={styles.linkIcon}>{link.icon}</span>
        <motion.span
          animate={{
            opacity: open ? 1 : 0,
            display: open ? 'inline-block' : 'none',
          }}
          transition={{ duration: 0.15 }}
          className={styles.linkLabel}
        >
          {link.label}
        </motion.span>
      </div>
    </a>
  );
};

/* ─── Logo Component ─── */
export interface SidebarLogoProps {
  title?: string;
  href?: string;
  className?: string;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({
  title = 'Acet Labs',
  href = '#',
  className = '',
}) => {
  const { open } = useSidebar();

  return (
    <a href={href} className={\`\${styles.logo} \${className}\`}>
      <div className={styles.logoMark} />
      <motion.span
        animate={{
          opacity: open ? 1 : 0,
          display: open ? 'inline-block' : 'none',
        }}
        transition={{ duration: 0.15 }}
        className={styles.logoText}
      >
        {title}
      </motion.span>
    </a>
  );
};

/* ─── User Profile Component ─── */
export interface SidebarUserProfileProps {
  name?: string;
  subtitle?: string;
  avatarUrl?: string;
  href?: string;
  className?: string;
}

export const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({
  name = 'Manu Arora',
  subtitle = 'Founder & Developer',
  avatarUrl = 'https://assets.aceternity.com/manu.png',
  href = '#',
  className = '',
}) => {
  const { open } = useSidebar();

  return (
    <div className={\`\${styles.profileSection} \${className}\`}>
      <a href={href} className={styles.profileCard}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} className={styles.avatar} />
        <motion.div
          animate={{
            opacity: open ? 1 : 0,
            display: open ? 'flex' : 'none',
          }}
          transition={{ duration: 0.15 }}
          className={styles.profileInfo}
        >
          <span className={styles.profileName}>{name}</span>
          {subtitle && <span className={styles.profileSubtitle}>{subtitle}</span>}
        </motion.div>
      </a>
    </div>
  );
};

/* ─── Mock Dashboard Component ─── */
export const SidebarMockDashboard: React.FC = () => {
  return (
    <div className={styles.dashboardArea}>
      <div className={styles.dashboardCard}>
        {/* 4 Metrics pulse cards */}
        <div className={styles.skeletonTopGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={\`metric-\${i}\`} className={styles.skeletonCard} />
          ))}
        </div>
        {/* 2 Main content pulse cards */}
        <div className={styles.skeletonMainGrid}>
          {[...Array(2)].map((_, i) => (
            <div key={\`main-\${i}\`} className={styles.skeletonMain} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Complete 1:1 Simple Sidebar Block / Demo ─── */
export interface SimpleSidebarProps {
  collapsible?: boolean;
  theme?: 'auto' | 'dark' | 'light';
  logoTitle?: string;
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SimpleSidebar: React.FC<SimpleSidebarProps> = ({
  collapsible = false,
  theme = 'auto',
  logoTitle = 'Acet Labs',
  userName = 'Manu Arora',
  userRole = 'manu@aceternity.com',
  avatarUrl = 'https://assets.aceternity.com/manu.png',
  className = '',
  style,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const primaryLinks: SidebarLinkItem[] = [
    { label: 'Dashboard', href: '#', icon: <LayoutDashboard size={18} /> },
    { label: 'Profile', href: '#', icon: <UserCheck size={18} /> },
    { label: 'Billing', href: '#', icon: <CreditCard size={18} /> },
    { label: 'Orders', href: '#', icon: <ShoppingBag size={18} /> },
  ];

  const secondaryLinks: SidebarLinkItem[] = [
    { label: 'Documentation', href: '#', icon: <BookOpen size={18} /> },
    { label: 'API Reference', href: '#', icon: <Terminal size={18} /> },
    { label: 'Support', href: '#', icon: <LifeBuoy size={18} /> },
    { label: 'Sponsor', href: '#', icon: <HeartHandshake size={18} /> },
  ];

  const dataThemeAttr = theme === 'auto' ? undefined : theme;

  return (
    <div
      className={\`\${styles.sidebarLayout} \${className}\`}
      data-theme={dataThemeAttr}
      style={style}
    >
      <Sidebar collapsible={collapsible}>
        <SidebarBody>
          <div>
            <SidebarLogo title={logoTitle} />

            <nav className={styles.linksContainer}>
              {primaryLinks.map((link, idx) => (
                <SidebarLink
                  key={link.label}
                  id={\`pri-\${idx}\`}
                  link={link}
                  activeId={hoveredId}
                  onHover={setHoveredId}
                />
              ))}
            </nav>

            <div className={styles.divider} />

            <nav className={styles.linksContainer}>
              {secondaryLinks.map((link, idx) => (
                <SidebarLink
                  key={link.label}
                  id={\`sec-\${idx}\`}
                  link={link}
                  activeId={hoveredId}
                  onHover={setHoveredId}
                />
              ))}
            </nav>
          </div>

          <SidebarUserProfile
            name={userName}
            subtitle={userRole}
            avatarUrl={avatarUrl}
          />
        </SidebarBody>
      </Sidebar>

      {/* Main Dashboard Canvas */}
      <SidebarMockDashboard />
    </div>
  );
};
`;

export const FULL_SIDEBAR_SCSS = `/* Sidebar - 1:1 Aceternity UI Simple Sidebar with Hover Highlight */

.sidebarLayout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 520px;
  max-width: 100%;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background-color: #f3f4f6;
  color: #111827;
  box-sizing: border-box;
  position: relative;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  @media (min-width: 768px) {
    flex-direction: row;
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #18181b;
    border-color: rgba(255, 255, 255, 0.1);
    color: #f4f4f5;
  }
}

.desktopSidebar {
  display: none;
  height: 100%;
  flex-shrink: 0;
  background-color: #ffffff;
  padding: 16px 12px;
  box-sizing: border-box;
  position: relative;
  z-index: 20;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  flex-direction: column;
  justify-content: space-between;

  @media (min-width: 768px) {
    display: flex;
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #09090b;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.collapseToggleBtn {
  position: absolute;
  top: 18px;
  right: -10px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  color: #52525b;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;

  &:hover {
    color: #09090b;
    background: #f4f4f5;
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background: #18181b;
    border-color: rgba(255, 255, 255, 0.15);
    color: #a1a1aa;

    &:hover {
      color: #fafafa;
      background: #27272a;
    }
  }
}

.mobileBar {
  display: flex;
  height: 52px;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0 16px;
  box-sizing: border-box;
  z-index: 30;

  @media (min-width: 768px) {
    display: none;
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #09090b;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.mobileMenuBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #3f3f46;
  padding: 6px;
  border-radius: 6px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    color: #d4d4d8;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.mobileDrawer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 24px;
  box-sizing: border-box;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #09090b;
  }
}

.mobileCloseBtn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 50;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #71717a;
  padding: 6px;
  border-radius: 6px;

  &:hover {
    color: #09090b;
    background: rgba(0, 0, 0, 0.05);
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    color: #a1a1aa;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.logo {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  text-decoration: none;
  color: #09090b;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.015em;
  border-radius: 8px;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    color: #fafafa;
  }
}

.logoMark {
  width: 22px;
  height: 22px;
  border-top-left-radius: 8px;
  border-top-right-radius: 2px;
  border-bottom-right-radius: 8px;
  border-bottom-left-radius: 2px;
  background-color: #09090b;
  flex-shrink: 0;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #ffffff;
  }
}

.logoText {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linksContainer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 20px;
}

.sidebarLink {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  color: #52525b;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.15s ease;
  user-select: none;

  &:hover {
    color: #09090b;

    .linkLabel {
      transform: translateX(4px);
      color: #09090b;
    }
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    color: #a1a1aa;

    &:hover {
      color: #ffffff;

      .linkLabel {
        color: #ffffff;
      }
    }
  }
}

.hoverPill {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.06);

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

.linkContent {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.linkIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.linkLabel {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s ease;
}

.divider {
  height: 1px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.07);
  margin: 14px 0;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

.profileSection {
  margin-top: auto;
  padding-top: 12px;
}

.profileCard {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: #18181b;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    color: #f4f4f5;

    &:hover {
      background-color: rgba(255, 255, 255, 0.06);
    }
  }
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.profileInfo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.profileName {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profileSubtitle {
  font-size: 0.72rem;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    color: #a1a1aa;
  }
}

.dashboardArea {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
}

.dashboardCard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background-color: #ffffff;
  padding: 16px;
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 24px;
    border-top-left-radius: 20px;
  }

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #09090b;
    border-color: rgba(255, 255, 255, 0.08);
  }
}

.skeletonTopGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.skeletonCard {
  height: 80px;
  width: 100%;
  border-radius: 10px;
  background-color: #f4f4f5;
  animation: pulseCard 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #18181b;
  }
}

.skeletonMainGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
  flex: 1;
  min-height: 220px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.skeletonMain {
  height: 100%;
  min-height: 220px;
  width: 100%;
  border-radius: 12px;
  background-color: #f4f4f5;
  animation: pulseCard 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  :global([data-theme='dark']) &,
  &[data-theme='dark'] {
    background-color: #18181b;
  }
}

@keyframes pulseCard {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
`;



export const FULL_FAQ_TSX = `'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import styles from './FAQ.module.scss';

// See FAQ.module.scss for full styles
export interface FAQItem { question: string; answer: string; }
export interface FAQSection { title: string; items: FAQItem[]; }
export interface FAQProps {
  sections?: FAQSection[];
  title?: string;
  subtitle?: string;
  contactEmail?: string;
  theme?: 'auto' | 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 38 }) => {
  const words = text.split(' ');
  const [count, setCount] = useState(0);
  useEffect(() => { setCount(0); }, [text]);
  useEffect(() => {
    if (count >= words.length) return;
    const t = setTimeout(() => setCount(c => c + 1), speed);
    return () => clearTimeout(t);
  }, [count, words.length, speed]);
  return (
    <span>
      {words.slice(0, count).map((word, i) => (
        <motion.span key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }} style={{ display: 'inline' }}>
          {word}{i < words.length - 1 ? '\\u00a0' : ''}
        </motion.span>
      ))}
    </span>
  );
};

const FAQAccordionItem: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({ item, isOpen, onToggle }) => {
  const [animKey, setAnimKey] = useState(0);
  const prevOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpen.current) setAnimKey(k => k + 1);
    prevOpen.current = isOpen;
  }, [isOpen]);
  return (
    <div className={isOpen ? \\\`\\\${styles.item} \\\${styles.itemOpen}\\\` : styles.item}>
      <button type="button" className={styles.itemTrigger} onClick={onToggle} aria-expanded={isOpen}>
        <span className={styles.question}>{item.question}</span>
        <span className={styles.icon}>{isOpen ? <X size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: 'hidden' }}>
            <div className={styles.answerCard}>
              <p className={styles.answer}><Typewriter key={animKey} text={item.answer} /></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ: React.FC<FAQProps> = ({ sections = [], title = 'Frequently Asked Questions', subtitle, contactEmail, theme = 'auto', className = '', style }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => prev === id ? null : id);
  return (
    <div className={className ? \\\`\\\${styles.root} \\\${className}\\\` : styles.root} data-theme={theme === 'auto' ? undefined : theme} style={style}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}{contactEmail && <> <a href={\\\`mailto:\\\${contactEmail}\\\`} className={styles.email}>{contactEmail}</a></>}</p>}
      </div>
      <div className={styles.sections}>
        {sections.map((section, si) => (
          <div key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.sectionItems}>
              {section.items.map((item, ii) => {
                const id = \\\`\\\${si}-\\\${ii}\\\`;
                return <FAQAccordionItem key={id} item={item} isOpen={openId === id} onToggle={() => toggle(id)} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`;

export const FULL_FAQ_SCSS = `/* FAQ.module.scss — copy full file from src/components/ui/FAQ/FAQ.module.scss */`;

export const FULL_NAVBAR_HOVER_TSX = `/* NavbarHover.tsx — copy full file from src/components/ui/NavbarHover/NavbarHover.tsx */`;

export const FULL_NAVBAR_HOVER_SCSS = `/* NavbarHover.module.scss — copy full file from src/components/ui/NavbarHover/NavbarHover.module.scss */`;

export const FULL_BENTO_EXPAND_TSX = `/* BentoExpand.tsx — copy full file from src/components/ui/BentoExpand/BentoExpand.tsx */`;

export const FULL_BENTO_EXPAND_SCSS = `/* BentoExpand.module.scss — copy full file from src/components/ui/BentoExpand/BentoExpand.module.scss */`;

export const FULL_COPY_BUTTON_TSX = `/* CopyButton.tsx — copy full file from src/components/ui/CopyButton/CopyButton.tsx */`;

export const FULL_COPY_BUTTON_SCSS = `/* CopyButton.module.scss — copy full file from src/components/ui/CopyButton/CopyButton.module.scss */`;

export const FULL_FOOTER_REVEAL_TSX = `/* FooterReveal.tsx — copy full file from src/components/ui/FooterReveal/FooterReveal.tsx */`;

export const FULL_FOOTER_REVEAL_SCSS = `/* FooterReveal.module.scss — copy full file from src/components/ui/FooterReveal/FooterReveal.module.scss */`;

export const FULL_TYPEWRITER_TSX = `/* Typewriter.tsx — copy full file from src/components/ui/Typewriter/Typewriter.tsx */`;

export const FULL_TYPEWRITER_SCSS = `/* Typewriter.module.scss — copy full file from src/components/ui/Typewriter/Typewriter.module.scss */`;

export const FULL_USER_BUTTON_TSX = `'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './UserButton.module.scss';

export interface UserProfile {
  fullName?: string;
  email?: string;
  initials?: string;
}

export interface UserButtonProps {
  /** User profile data */
  user?: UserProfile;
  /** Theme: 'dark' | 'light' | 'auto' (Dark by default) */
  theme?: 'dark' | 'light' | 'auto';
  /** Called when user clicks "Sign out" */
  onSignOut?: () => void;
  /** Called when user clicks "Manage account" */
  onManageAccount?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_USER: Required<UserProfile> = {
  fullName: 'Ada Lovelace',
  email: 'ada@motion.dev',
  initials: 'AL',
};

const SPRING = {
  type: 'spring' as const,
  bounce: 0.15,
  visualDuration: 0.25,
};

const contentAnimations = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)', transition: { delay: 0.15 } },
  exit: { opacity: 0, filter: 'blur(8px)' },
};

function SecuredByClerk() {
  return (
    <a
      href="https://clerk.com"
      target="_blank"
      rel="noreferrer"
      className={styles.clerkCredit}
      title="Secured by Clerk"
    >
      <span>Secured by</span>
      <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 14" aria-label="Clerk">
        <ellipse cx="7.889" cy="7" rx="2.187" ry="2.188" fill="currentColor" />
        <path
          d="M11.83 12.18a.415.415 0 0 1-.05.64A6.967 6.967 0 0 1 7.888 14a6.967 6.967 0 0 1-3.891-1.18.415.415 0 0 1-.051-.64l1.598-1.6a.473.473 0 0 1 .55-.074 3.92 3.92 0 0 0 1.794.431 3.92 3.92 0 0 0 1.792-.43.473.473 0 0 1 .551.074l1.599 1.598Z"
          fill="currentColor"
        />
        <path
          opacity="0.5"
          d="M11.78 1.18a.415.415 0 0 1 .05.64l-1.598 1.6a.473.473 0 0 1-.55.073 3.937 3.937 0 0 0-5.3 5.3.473.473 0 0 1-.074.55L2.71 10.942a.415.415 0 0 1-.641-.051 7 7 0 0 1 9.71-9.71Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.748 1.422c0-.06.05-.11.11-.11h1.64c.06 0 .11.05.11.11v11.156a.11.11 0 0 1-.11.11h-1.64a.11.11 0 0 1-.11-.11V1.422Zm-2.315 8.9a.112.112 0 0 0-.15.004 2.88 2.88 0 0 1-.884.569c-.36.148-.747.222-1.137.219-.33.01-.658-.047-.965-.166a2.422 2.422 0 0 1-.817-.527c-.424-.432-.668-1.05-.668-1.785 0-1.473.98-2.48 2.45-2.48.394-.005.785.074 1.144.234.325.144.617.35.86.607.04.044.11.049.155.01l1.108-.959a.107.107 0 0 0 .01-.152c-.832-.93-2.138-1.412-3.379-1.412-2.499 0-4.27 1.686-4.27 4.166 0 1.227.44 2.26 1.182 2.99.743.728 1.801 1.157 3.022 1.157 1.53 0 2.763-.587 3.485-1.34a.107.107 0 0 0-.009-.155l-1.137-.98Zm13.212-1.14a.108.108 0 0 1-.107.096H28.79a.106.106 0 0 0-.104.132c.286 1.06 1.138 1.701 2.302 1.701a2.59 2.59 0 0 0 1.136-.236 2.55 2.55 0 0 0 .862-.645.08.08 0 0 1 .112-.01l1.155 1.006c.044.039.05.105.013.15-.698.823-1.828 1.42-3.38 1.42-2.386 0-4.185-1.651-4.185-4.162 0-1.232.424-2.264 1.13-2.994.373-.375.82-.67 1.314-.87a3.968 3.968 0 0 1 1.557-.285c2.419 0 3.983 1.701 3.983 4.05a6.737 6.737 0 0 1-.04.647Zm-5.924-1.524a.104.104 0 0 0 .103.133h3.821c.07 0 .123-.066.103-.134-.26-.901-.921-1.503-1.947-1.503a2.13 2.13 0 0 0-.88.16 2.1 2.1 0 0 0-.733.507 2.242 2.242 0 0 0-.467.837Zm11.651-3.172c.061-.001.11.048.11.109v1.837a.11.11 0 0 1-.117.109 7.17 7.17 0 0 0-.455-.024c-1.43 0-2.27 1.007-2.27 2.329v3.732a.11.11 0 0 1-.11.11h-1.64a.11.11 0 0 1-.11-.11v-7.87c0-.06.049-.109.11-.109h1.64c.06 0 .11.05.11.11v1.104a.011.011 0 0 0 .02.007c.64-.857 1.587-1.333 2.587-1.333l.125-.001Zm4.444 4.81a.035.035 0 0 1 .056.006l2.075 3.334a.11.11 0 0 0 .093.052h1.865a.11.11 0 0 0 .093-.168L46.152 7.93a.11.11 0 0 1 .012-.131l2.742-3.026a.11.11 0 0 0-.081-.183h-1.946a.11.11 0 0 0-.08.036l-3.173 3.458a.11.11 0 0 1-.19-.074V1.422a.11.11 0 0 0-.11-.11h-1.64a.11.11 0 0 0-.11.11v11.156c0 .06.05.11.11.11h1.64a.11.11 0 0 0 .11-.11v-1.755a.11.11 0 0 1 .03-.075l1.35-1.452Z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}

function GearIcon() {
  return (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.559 2.536A.667.667 0 0 1 7.212 2h1.574a.667.667 0 0 1 .653.536l.22 1.101c.466.178.9.429 1.287.744l1.065-.36a.667.667 0 0 1 .79.298l.787 1.362a.666.666 0 0 1-.136.834l-.845.742c.079.492.079.994 0 1.486l.845.742a.666.666 0 0 1 .137.833l-.787 1.363a.667.667 0 0 1-.791.298l-1.065-.36c-.386.315-.82.566-1.286.744l-.22 1.101a.666.666 0 0 1-.654.536H7.212a.666.666 0 0 1-.653-.536l-.22-1.101a4.664 4.664 0 0 1-1.287-.744l-1.065.36a.666.666 0 0 1-.79-.298L2.41 10.32a.667.667 0 0 1 .136-.834l.845-.743a4.7 4.7 0 0 1 0-1.485l-.845-.742a.666.666 0 0 1-.137-.833l.787-1.363a.667.667 0 0 1 .791-.298l1.065.36c.387-.315.821-.566 1.287-.744l.22-1.101ZM7.999 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.6 2.604A2.045 2.045 0 0 1 4.052 2h3.417c.544 0 1.066.217 1.45.604.385.387.601.911.601 1.458v.69c0 .413-.334.75-.746.75a.748.748 0 0 1-.745-.75v-.69a.564.564 0 0 0-.56-.562H4.051a.558.558 0 0 0-.56.563v7.875a.564.564 0 0 0 .56.562h3.417a.558.558 0 0 0 .56-.563v-.671c0-.415.333-.75.745-.75s.746.335.746.75v.671c0 .548-.216 1.072-.6 1.459a2.045 2.045 0 0 1-1.45.604H4.05a2.045 2.045 0 0 1-1.45-.604A2.068 2.068 0 0 1 2 11.937V4.064c0-.548.216-1.072.6-1.459Zm8.386 3.116a.743.743 0 0 1 1.055 0l1.74 1.75a.753.753 0 0 1 0 1.06l-1.74 1.75a.743.743 0 0 1-1.055 0 .753.753 0 0 1 0-1.06l.467-.47H5.858A.748.748 0 0 1 5.112 8c0-.414.334-.75.746-.75h5.595l-.467-.47a.753.753 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function Avatar({ initials, large = false }: { initials: string; large?: boolean }) {
  return (
    <motion.div
      layoutId="clerk-avatar"
      transition={SPRING}
      className={large ? styles.avatarLarge : styles.avatar}
    >
      {initials}
    </motion.div>
  );
}

function MenuContent({
  user,
  onManage,
  onSignOut,
}: {
  user: Required<UserProfile>;
  onManage: () => void;
  onSignOut: () => void;
}) {
  return (
    <motion.div
      layoutId="clerk-userbtn"
      className={styles.open}
      style={{ borderRadius: 16 }}
      transition={SPRING}
    >
      <div className={styles.menuHeader}>
        <div style={{ alignSelf: 'center' }}>
          <Avatar initials={user.initials} large />
        </div>
        <motion.div
          className={styles.menuHeaderContent}
          initial={contentAnimations.initial}
          animate={contentAnimations.animate}
          exit={contentAnimations.exit}
        >
          <p>{user.fullName}</p>
          <p>{user.email}</p>
        </motion.div>
      </div>

      <motion.div
        className={styles.menuContent}
        initial={contentAnimations.initial}
        animate={contentAnimations.animate}
        exit={contentAnimations.exit}
      >
        <div
          className={styles.menuItem}
          onClick={onManage}
          role="button"
          tabIndex={0}
        >
          <GearIcon />
          <span>Manage account</span>
        </div>

        <div
          className={styles.menuItem}
          onClick={onSignOut}
          role="button"
          tabIndex={0}
        >
          <SignOutIcon />
          <span>Sign out</span>
        </div>

        <div style={{ marginTop: 4 }}>
          <SecuredByClerk />
        </div>
      </motion.div>
    </motion.div>
  );
}

export const UserButton: React.FC<UserButtonProps> = ({
  user: userProp,
  theme = 'dark',
  onSignOut,
  onManageAccount,
  className,
  style,
}) => {
  const mergedUser: Required<UserProfile> = {
    fullName: userProp?.fullName || DEFAULT_USER.fullName,
    email: userProp?.email || DEFAULT_USER.email,
    initials:
      userProp?.initials ||
      (userProp?.fullName
        ? userProp.fullName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : DEFAULT_USER.initials),
  };

  const [signedIn, setSignedIn] = useState(true);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const [autoTheme, setAutoTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (theme !== 'auto') return;
    const checkTheme = () => {
      const docTheme = document.documentElement.getAttribute('data-theme');
      setAutoTheme(docTheme === 'light' ? 'light' : 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [theme]);

  const activeTheme = theme === 'auto' ? autoTheme : theme;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    setSignedIn(false);
    onSignOut?.();
  };

  const handleManage = () => {
    setOpen(false);
    onManageAccount?.();
  };

  return (
    <div
      className={\`\${styles.wrapper} \${className || ''}\`}
      data-theme={activeTheme}
      style={style}
      ref={rootRef}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {signedIn ? (
          <div className={styles.root} key="user-button-root">
            <AnimatePresence>
              {!open ? (
                <motion.button
                  key="closed"
                  layoutId="clerk-userbtn"
                  className={styles.closed}
                  style={{ borderRadius: 99 }}
                  transition={SPRING}
                  onClick={() => setOpen(true)}
                  aria-label="Open account menu"
                  type="button"
                >
                  <Avatar initials={mergedUser.initials} />
                </motion.button>
              ) : (
                <MenuContent
                  key="open"
                  user={mergedUser}
                  onManage={handleManage}
                  onSignOut={handleSignOut}
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            key="sign-in"
            className={styles.btn}
            onClick={() => setSignedIn(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.2 }}
            type="button"
          >
            Sign in
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
`;

export const FULL_USER_BUTTON_SCSS = `/*
 * UserButton.module.scss
 * Motion.dev "Clerk: User Button" — 1:1 Layout morphing animation
 */

.wrapper {
  --surface: #1e222e;
  --surface-card: #151821;
  --text-primary: #ededed;
  --text-secondary: rgba(237, 237, 237, 0.7);
  --border: rgba(255, 255, 255, 0.1);
  --accent: #9ca3af;
  --shadow-closed: 0 8px 16px -3px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  --shadow-open: 0 0px 32px -8px rgba(0, 0, 0, 0.5), 0 16px 20px -6px rgba(0, 0, 0, 0.4), 0 6px 7px -6px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  --btn-bg: #1e222e;
  --btn-text: #ededed;
  --btn-border: rgba(255, 255, 255, 0.12);

  position: relative;
  display: inline-flex;
  background: transparent;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-primary);

  &, & * {
    box-sizing: border-box;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  /* Light Theme */
  &[data-theme='light'] {
    --surface: #f7f7f8;
    --surface-card: #ffffff;
    --text-primary: #212126;
    --text-secondary: rgba(33, 33, 38, 0.72);
    --border: rgba(0, 0, 0, 0.06);
    --accent: #6b7280;
    --shadow-closed: 0 8px 8px -3px rgb(0 0 0 / 0.1), 0 2px 3px -2px rgb(0 0 0 / 0.1), 0 0 0 0.5px rgb(0 0 0 / 0.1), inset 0 0 0 1px rgb(255 255 255);
    --shadow-open: 0 0px 32px -8px rgb(0 0 0 / 0.1), 0 16px 20px -6px rgb(0 0 0 / 0.08), 0 6px 7px -6px rgb(0 0 0 / 0.2), 0 0 0 0.5px rgb(0 0 0 / 0.1), inset 0 0 0 1px rgb(255 255 255);
    --btn-bg: #f7f7f8;
    --btn-text: #212126;
    --btn-border: rgba(0, 0, 0, 0.08);
  }
}

.root {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
}

/* ── Closed Trigger Button ── */
.closed {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 99px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--surface);
  background-image: linear-gradient(to bottom, rgb(0 0 0 / 0), rgb(0 0 0 / 0.03));
  box-shadow: var(--shadow-closed);
}

/* Both avatars are the exact same fixed size; their shared layoutId
 * morphs position between the button and the menu header without scaling. */
.avatar,
.avatarLarge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 99px;
  background: linear-gradient(140deg, #6c47ff, #9b8cff);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  user-select: none;
}

.avatarLarge {
  font-size: 0.875rem;
}

/* ── Open Menu Container ── */
.open {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 90;
  width: 216px;
  padding: 0.125rem;
  border-radius: 16px;
  overflow: hidden;
  background-color: var(--surface);
  background-image: linear-gradient(to bottom, rgb(0 0 0 / 0), rgb(0 0 0 / 0.03));
  box-shadow: var(--shadow-open);
}

.menuHeader {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.menuHeaderContent {
  text-align: center;
  align-self: center;

  p:nth-child(1) {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  p:nth-child(2) {
    margin: 0;
    margin-top: 4px;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 400;
    color: var(--text-secondary);
  }
}

.menuContent {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: 1rem;
  background-color: var(--surface-card);
  box-shadow: inset 0 -1px 2px rgb(0 0 0 / 0.03), 0 0 0 0.5px var(--border);
}

.menuItem {
  height: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  user-select: none;
  font-size: 0.8125rem;
  line-height: 1rem;
  position: relative;
  overflow: hidden;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--text-primary);

  &:first-child {
    border-top-left-radius: 0.75rem;
    border-top-right-radius: 0.75rem;
  }
  &:last-child {
    border-bottom-left-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
  }

  &:hover {
    box-shadow: inset 0 0 0 0.5px var(--border);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-color: currentColor;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover::after {
    opacity: 0.05;
  }
  &:active::after {
    opacity: 0.08;
  }

  svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
}

.clerkCredit {
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  line-height: 1rem;
  font-weight: 400;
  color: var(--accent);
  transition: color 0.15s ease;

  &:hover {
    color: var(--text-primary);
  }

  svg {
    height: 0.75rem;
    width: auto;
  }
}

/* ── Sign In Button ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 2rem;
  border: 0;
  padding: 0 0.75rem;
  background-color: var(--surface);
  color: var(--text-primary);
  border-radius: 0.5rem;
  overflow: hidden;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: inset 0 12px 0 -11px rgba(255, 255, 255, 0.06), 0 2px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0) 60%);
  }
  &:hover::after {
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
  }
  &:active::after {
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08));
  }
}
`;

export const FULL_IOS_POINTER_TSX = "'use client';\n\nimport React, { useCallback, useEffect, useRef, useState } from 'react';\nimport {\n  AnimatePresence,\n  animate,\n  motion,\n  motionValue,\n  useMotionValue,\n  useTransform,\n  type MotionValue,\n} from 'framer-motion';\nimport styles from './IosPointer.module.scss';\n\nexport interface IosPointerProps {\n  /** Text label on the primary iOS button (default: \"Appearance\") */\n  label?: string;\n  /** Demo presentation mode: 'single' | 'navbar' | 'segmented' */\n  mode?: 'single' | 'navbar' | 'segmented';\n  /** Theme: 'dark' | 'light' | 'auto' */\n  theme?: 'dark' | 'light' | 'auto';\n  /** Magnetic text pull factor (default: 0.1) */\n  magneticStrength?: number;\n  className?: string;\n  style?: React.CSSProperties;\n}\n\ninterface TargetInfo {\n  id: string;\n  element: HTMLElement;\n  rect: DOMRect;\n}\n\n// Exact Motion.dev constants\nconst DEFAULT_CURSOR_SIZE = 17;\nconst PADDING = 5; // 5px padding on each side -> +10px total\nconst SNAP_TRANSITION = { duration: 0.15, ease: [0.38, 0.12, 0.29, 1] } as const;\n\n// Chevron Icon exact SVG from Motion.dev\nfunction ChevronLeft() {\n  return (\n    <svg\n      className={styles.chevronIcon}\n      width=\"12\"\n      height=\"20\"\n      viewBox=\"0 0 12 20\"\n      fill=\"none\"\n      xmlns=\"http://www.w3.org/2000/svg\"\n      aria-hidden=\"true\"\n    >\n      <path\n        d=\"M10 2L2 10L10 18\"\n        stroke=\"currentColor\"\n        strokeWidth=\"2\"\n        strokeLinecap=\"round\"\n        strokeLinejoin=\"round\"\n      />\n    </svg>\n  );\n}\n\n// Gear Icon for navbar mode\nfunction SettingsIcon() {\n  return (\n    <svg\n      width=\"20\"\n      height=\"20\"\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      strokeWidth=\"2\"\n      strokeLinecap=\"round\"\n      strokeLinejoin=\"round\"\n      aria-hidden=\"true\"\n    >\n      <circle cx=\"12\" cy=\"12\" r=\"3\" />\n      <path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\" />\n    </svg>\n  );\n}\n\n// Share Icon\nfunction ShareIcon() {\n  return (\n    <svg\n      width=\"20\"\n      height=\"20\"\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      strokeWidth=\"2\"\n      strokeLinecap=\"round\"\n      strokeLinejoin=\"round\"\n      aria-hidden=\"true\"\n    >\n      <path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\" />\n      <polyline points=\"16 6 12 2 8 6\" />\n      <line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"15\" />\n    </svg>\n  );\n}\n\nexport const IosPointer: React.FC<IosPointerProps> = ({\n  label = 'Appearance',\n  mode = 'single',\n  theme = 'auto',\n  magneticStrength = 0.1,\n  className,\n  style,\n}) => {\n  const containerRef = useRef<HTMLDivElement>(null);\n  const primaryButtonRef = useRef<HTMLButtonElement>(null);\n\n  // Theme management\n  const [autoTheme, setAutoTheme] = useState<'dark' | 'light'>('dark');\n\n  useEffect(() => {\n    if (theme !== 'auto') return;\n    const checkTheme = () => {\n      const docTheme = document.documentElement.getAttribute('data-theme');\n      setAutoTheme(docTheme === 'light' ? 'light' : 'dark');\n    };\n    checkTheme();\n    const observer = new MutationObserver(checkTheme);\n    observer.observe(document.documentElement, {\n      attributes: true,\n      attributeFilter: ['data-theme'],\n    });\n    return () => observer.disconnect();\n  }, [theme]);\n\n  const activeTheme = theme === 'auto' ? autoTheme : theme;\n\n  const [isInside, setIsInside] = useState(false);\n  const [isPressed, setIsPressed] = useState(false);\n  const [activeTarget, setActiveTarget] = useState<TargetInfo | null>(null);\n\n  // Track active target ID to ensure transitions ONLY trigger once on state changes,\n  // preventing constant animation restarts on every mousemove frame\n  const currentTargetIdRef = useRef<string | null>(null);\n\n  // Raw mouse coordinates relative to container\n  const pointerX = useMotionValue(0);\n  const pointerY = useMotionValue(0);\n\n  // Snapped target center coordinates relative to container\n  const targetCenterX = useMotionValue(0);\n  const targetCenterY = useMotionValue(0);\n\n  // Magnetic weight (0 = free dot following mouse 1:1, 0.8 = snapped with 20% drag resistance)\n  const snapWeight = useMotionValue(0);\n\n  // Cursor dimensions (17px free dot, rect.width + 10 / rect.height + 10 when snapped)\n  const cursorWidth = useMotionValue(DEFAULT_CURSOR_SIZE);\n  const cursorHeight = useMotionValue(DEFAULT_CURSOR_SIZE);\n\n  // Computed cursor position via transform interpolation\n  const cursorX = useTransform(() => {\n    const px = pointerX.get();\n    const tx = targetCenterX.get();\n    const w = snapWeight.get();\n    return px + (tx - px) * w;\n  });\n\n  const cursorY = useTransform(() => {\n    const py = pointerY.get();\n    const ty = targetCenterY.get();\n    const w = snapWeight.get();\n    return py + (ty - py) * w;\n  });\n\n  // Per-target magnetic parallax pure motion values (id -> { x: MotionValue, y: MotionValue })\n  const targetsMap = useRef<Map<string, { x: MotionValue<number>; y: MotionValue<number> }>>(new Map());\n\n  const getTargetMotion = useCallback((id: string) => {\n    let entry = targetsMap.current.get(id);\n    if (!entry) {\n      entry = {\n        x: motionValue(0),\n        y: motionValue(0),\n      };\n      targetsMap.current.set(id, entry);\n    }\n    return entry;\n  }, []);\n\n  // Fast, accurate target detection\n  const checkTargetUnderPointer = useCallback((clientX: number, clientY: number): TargetInfo | null => {\n    const container = containerRef.current;\n    if (!container) return null;\n\n    const interactiveElements = container.querySelectorAll<HTMLElement>(\n      'button, [data-cursor=\"pointer\"]'\n    );\n\n    const threshold = 4; // Tight, instant proximity activation\n    for (const el of Array.from(interactiveElements)) {\n      const rect = el.getBoundingClientRect();\n      if (\n        clientX >= rect.left - threshold &&\n        clientX <= rect.right + threshold &&\n        clientY >= rect.top - threshold &&\n        clientY <= rect.bottom + threshold\n      ) {\n        const id = el.getAttribute('data-pointer-id') || el.innerText || 'target';\n        return { id, element: el, rect };\n      }\n    }\n    return null;\n  }, []);\n\n  // Handle pointer move\n  const handlePointerMove = useCallback(\n    (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {\n      const container = containerRef.current;\n      if (!container) return;\n\n      const cRect = container.getBoundingClientRect();\n      const localX = e.clientX - cRect.left;\n      const localY = e.clientY - cRect.top;\n\n      if (!isInside) {\n        pointerX.jump(localX);\n        pointerY.jump(localY);\n        setIsInside(true);\n      } else {\n        pointerX.set(localX);\n        pointerY.set(localY);\n      }\n\n      const target = checkTargetUnderPointer(e.clientX, e.clientY);\n      const targetId = target ? target.id : null;\n\n      // CRITICAL: Only trigger shape & snap animations when the target actually changes!\n      // Calling animate() on every single mousemove cancels and restarts the 150ms ease,\n      // which previously caused the sluggish morphing reported by the user.\n      if (targetId !== currentTargetIdRef.current) {\n        currentTargetIdRef.current = targetId;\n        setActiveTarget(target);\n\n        if (target) {\n          const rect = target.rect;\n          const cX = rect.left - cRect.left + rect.width / 2;\n          const cY = rect.top - cRect.top + rect.height / 2;\n\n          targetCenterX.set(cX);\n          targetCenterY.set(cY);\n\n          const targetW = rect.width + PADDING * 2;\n          const targetH = rect.height + PADDING * 2;\n\n          animate(cursorWidth, targetW, SNAP_TRANSITION);\n          animate(cursorHeight, targetH, SNAP_TRANSITION);\n          animate(snapWeight, 0.8, SNAP_TRANSITION);\n        } else {\n          // Instant return to 17px circle\n          animate(cursorWidth, DEFAULT_CURSOR_SIZE, SNAP_TRANSITION);\n          animate(cursorHeight, DEFAULT_CURSOR_SIZE, SNAP_TRANSITION);\n          animate(snapWeight, 0, SNAP_TRANSITION);\n\n          targetsMap.current.forEach((tMotion) => {\n            if (tMotion.x.get() !== 0 || tMotion.y.get() !== 0) {\n              animate(tMotion.x, 0, SNAP_TRANSITION);\n              animate(tMotion.y, 0, SNAP_TRANSITION);\n            }\n          });\n        }\n      } else if (target) {\n        // Target is already active: continuously track position & calculate magnetic parallax\n        const rect = target.rect;\n        const cX = rect.left - cRect.left + rect.width / 2;\n        const cY = rect.top - cRect.top + rect.height / 2;\n\n        targetCenterX.set(cX);\n        targetCenterY.set(cY);\n\n        const dx = localX - cX;\n        const dy = localY - cY;\n        const pullX = magneticStrength * dx;\n        const pullY = magneticStrength * dy;\n\n        const activeMotion = targetsMap.current.get(target.id);\n        if (activeMotion) {\n          activeMotion.x.set(pullX);\n          activeMotion.y.set(pullY);\n        }\n      }\n    },\n    [\n      isInside,\n      pointerX,\n      pointerY,\n      targetCenterX,\n      targetCenterY,\n      cursorWidth,\n      cursorHeight,\n      snapWeight,\n      checkTargetUnderPointer,\n      magneticStrength,\n    ]\n  );\n\n  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {\n    if (containerRef.current) {\n      const cRect = containerRef.current.getBoundingClientRect();\n      pointerX.jump(e.clientX - cRect.left);\n      pointerY.jump(e.clientY - cRect.top);\n    }\n    setIsInside(true);\n  };\n\n  const handlePointerLeave = () => {\n    setIsInside(false);\n    setActiveTarget(null);\n    currentTargetIdRef.current = null;\n    cursorWidth.set(DEFAULT_CURSOR_SIZE);\n    cursorHeight.set(DEFAULT_CURSOR_SIZE);\n    snapWeight.set(0);\n    targetsMap.current.forEach((tMotion) => {\n      tMotion.x.set(0);\n      tMotion.y.set(0);\n    });\n  };\n\n  const handlePointerDown = () => {\n    setIsPressed(true);\n  };\n\n  const handlePointerUp = () => {\n    setIsPressed(false);\n  };\n\n  // Keep target rect updated on window resize or scroll\n  useEffect(() => {\n    const handleScrollOrResize = () => {\n      if (activeTarget && activeTarget.element && containerRef.current) {\n        const updatedRect = activeTarget.element.getBoundingClientRect();\n        const cRect = containerRef.current.getBoundingClientRect();\n        setActiveTarget((prev) => (prev ? { ...prev, rect: updatedRect } : null));\n        targetCenterX.set(updatedRect.left - cRect.left + updatedRect.width / 2);\n        targetCenterY.set(updatedRect.top - cRect.top + updatedRect.height / 2);\n      }\n    };\n    window.addEventListener('scroll', handleScrollOrResize, { passive: true });\n    window.addEventListener('resize', handleScrollOrResize, { passive: true });\n    return () => {\n      window.removeEventListener('scroll', handleScrollOrResize);\n      window.removeEventListener('resize', handleScrollOrResize);\n    };\n  }, [activeTarget, targetCenterX, targetCenterY]);\n\n  return (\n    <div\n      ref={containerRef}\n      className={`${styles.wrapper} ${className || ''}`}\n      data-theme={activeTheme}\n      style={style}\n      onPointerMove={handlePointerMove}\n      onMouseMove={handlePointerMove}\n      onPointerEnter={handlePointerEnter}\n      onMouseEnter={handlePointerEnter}\n      onPointerLeave={handlePointerLeave}\n      onMouseLeave={handlePointerLeave}\n      onPointerDown={handlePointerDown}\n      onMouseDown={handlePointerDown}\n      onPointerUp={handlePointerUp}\n      onMouseUp={handlePointerUp}\n    >\n      <div className={styles.container}>\n        {mode === 'single' && (\n          <motion.button\n            ref={primaryButtonRef}\n            data-pointer-id=\"single-appearance\"\n            className={styles.button}\n            whileTap=\"pressed\"\n            type=\"button\"\n            data-cursor=\"pointer\"\n          >\n            <motion.span\n              className={styles.buttonLabel}\n              variants={{ pressed: { scale: 0.95 } }}\n              style={{\n                x: getTargetMotion('single-appearance').x,\n                y: getTargetMotion('single-appearance').y,\n              }}\n            >\n              <ChevronLeft />\n              <span>{label}</span>\n            </motion.span>\n          </motion.button>\n        )}\n\n        {mode === 'navbar' && (\n          <div className={styles.navBar}>\n            <motion.button\n              ref={primaryButtonRef}\n              data-pointer-id=\"nav-appearance\"\n              className={styles.button}\n              style={{ fontSize: 18, padding: '4px 8px' }}\n              whileTap=\"pressed\"\n              type=\"button\"\n              data-cursor=\"pointer\"\n            >\n              <motion.span\n                className={styles.buttonLabel}\n                variants={{ pressed: { scale: 0.95 } }}\n                style={{\n                  x: getTargetMotion('nav-appearance').x,\n                  y: getTargetMotion('nav-appearance').y,\n                }}\n              >\n                <ChevronLeft />\n                <span>{label}</span>\n              </motion.span>\n            </motion.button>\n\n            <div className={styles.navItems}>\n              <motion.button\n                data-pointer-id=\"nav-share\"\n                className={styles.iconButton}\n                whileTap=\"pressed\"\n                type=\"button\"\n                data-cursor=\"pointer\"\n                aria-label=\"Share\"\n              >\n                <motion.span\n                  className={styles.iconWrapper}\n                  variants={{ pressed: { scale: 0.95 } }}\n                  style={{\n                    x: getTargetMotion('nav-share').x,\n                    y: getTargetMotion('nav-share').y,\n                  }}\n                >\n                  <ShareIcon />\n                </motion.span>\n              </motion.button>\n\n              <motion.button\n                data-pointer-id=\"nav-settings\"\n                className={styles.iconButton}\n                whileTap=\"pressed\"\n                type=\"button\"\n                data-cursor=\"pointer\"\n                aria-label=\"Settings\"\n              >\n                <motion.span\n                  className={styles.iconWrapper}\n                  variants={{ pressed: { scale: 0.95 } }}\n                  style={{\n                    x: getTargetMotion('nav-settings').x,\n                    y: getTargetMotion('nav-settings').y,\n                  }}\n                >\n                  <SettingsIcon />\n                </motion.span>\n              </motion.button>\n\n              <motion.button\n                data-pointer-id=\"nav-done\"\n                className={styles.pillButton}\n                whileTap=\"pressed\"\n                type=\"button\"\n                data-cursor=\"pointer\"\n              >\n                <motion.span\n                  variants={{ pressed: { scale: 0.95 } }}\n                  style={{\n                    display: 'inline-block',\n                    willChange: 'transform',\n                    x: getTargetMotion('nav-done').x,\n                    y: getTargetMotion('nav-done').y,\n                  }}\n                >\n                  Done\n                </motion.span>\n              </motion.button>\n            </div>\n          </div>\n        )}\n\n        {mode === 'segmented' && (\n          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>\n            <motion.button\n              ref={primaryButtonRef}\n              data-pointer-id=\"seg-appearance\"\n              className={styles.button}\n              whileTap=\"pressed\"\n              type=\"button\"\n              data-cursor=\"pointer\"\n            >\n              <motion.span\n                className={styles.buttonLabel}\n                variants={{ pressed: { scale: 0.95 } }}\n                style={{\n                  x: getTargetMotion('seg-appearance').x,\n                  y: getTargetMotion('seg-appearance').y,\n                }}\n              >\n                <ChevronLeft />\n                <span>{label}</span>\n              </motion.span>\n            </motion.button>\n\n            <div\n              style={{\n                display: 'inline-flex',\n                gap: 8,\n                padding: '6px',\n                background: activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',\n                borderRadius: 12,\n              }}\n            >\n              {['Display', 'Sounds', 'Haptics'].map((item) => {\n                const segId = `seg-item-${item.toLowerCase()}`;\n                return (\n                  <motion.button\n                    key={item}\n                    data-pointer-id={segId}\n                    className={styles.pillButton}\n                    whileTap=\"pressed\"\n                    type=\"button\"\n                    data-cursor=\"pointer\"\n                  >\n                    <motion.span\n                      variants={{ pressed: { scale: 0.95 } }}\n                      style={{\n                        display: 'inline-block',\n                        willChange: 'transform',\n                        x: getTargetMotion(segId).x,\n                        y: getTargetMotion(segId).y,\n                      }}\n                    >\n                      {item}\n                    </motion.span>\n                  </motion.button>\n                );\n              })}\n            </div>\n          </div>\n        )}\n      </div>\n\n      {/* Floating / Morphed iOS Pointer */}\n      <AnimatePresence>\n        {isInside && (\n          <motion.div\n            className={`${styles.cursor} ${activeTarget ? styles.cursorSnapped : ''}`}\n            initial={{ opacity: 0, scale: 1 }}\n            animate={{\n              opacity: 1,\n              scale: isPressed ? 0.9 : 1,\n            }}\n            exit={{ opacity: 0, scale: 0 }}\n            transition={{ duration: 0.15 }}\n            transformTemplate={(_props, generated) => `translate(-50%, -50%) ${generated}`}\n            style={{\n              x: cursorX,\n              y: cursorY,\n              width: cursorWidth,\n              height: cursorHeight,\n              borderRadius: 10,\n            }}\n          />\n        )}\n      </AnimatePresence>\n    </div>\n  );\n};\n\nexport default IosPointer;\n";

export const FULL_IOS_POINTER_SCSS = "/*\n * IosPointer.module.scss\n * Motion.dev \"iOS Pointer Animation\" — Authentic iPadOS / iOS magnetic snapping cursor\n */\n\n.wrapper {\n  --text-blue: #0a84ff;\n  --cursor-default-bg: #7e7e7e;\n  --cursor-snapped-bg: #dddddd;\n  --cursor-blend: multiply;\n\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  min-height: 380px;\n  background: transparent;\n  border: none;\n  border-radius: 0;\n  box-shadow: none;\n  overflow: hidden;\n  user-select: none;\n  font-family: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n  cursor: none; // Hide native cursor within interactive preview\n  transition: none;\n\n  &, & * {\n    box-sizing: border-box;\n    cursor: none !important; // Hide standard cursor on all children inside stage\n  }\n\n  /* Dark Theme */\n  &[data-theme='dark'] {\n    --text-blue: #0a84ff;\n    --cursor-default-bg: rgba(255, 255, 255, 0.55);\n    --cursor-snapped-bg: rgba(255, 255, 255, 0.18);\n    --cursor-blend: screen;\n  }\n}\n\n/* ── Container Layout (Exact Motion.dev) ── */\n.container {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 2rem;\n  width: 100%;\n  height: 100%;\n  padding: 2.5rem;\n  background: transparent;\n  pointer-events: auto;\n}\n\n/* ── iOS Primary Button (Motion.dev exact) ── */\n.button {\n  position: relative;\n  background: none;\n  padding: 8px;\n  color: var(--text-blue);\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  border-radius: 0;\n  outline: none;\n  user-select: none;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n  font-weight: 500;\n  font-size: 24px;\n  line-height: 1.2;\n  transition: opacity 0.15s ease;\n\n  &:focus-visible {\n    box-shadow: 0 0 0 2px var(--text-blue);\n  }\n}\n\n.buttonLabel {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  will-change: transform;\n}\n\n.chevronIcon {\n  display: inline-block;\n  flex-shrink: 0;\n  width: 12px;\n  height: 20px;\n}\n\n/* ── iOS Pointer Element (Exact Motion.dev: constant borderRadius 10px, 150ms cubic-bezier morph) ── */\n.cursor {\n  position: absolute;\n  top: 0;\n  left: 0;\n  pointer-events: none;\n  will-change: transform, width, height;\n  contain: layout;\n  z-index: 9999;\n  border-radius: 10px;\n  transform-origin: 50% 50%;\n  mix-blend-mode: var(--cursor-blend);\n  background-color: var(--cursor-default-bg);\n  transition: background-color 0.15s ease;\n}\n\n/* Snapped state styling */\n.cursorSnapped {\n  background-color: var(--cursor-snapped-bg);\n}\n\n/* ── Additional iOS Navigation Demo Items (for navbar/segmented modes) ── */\n.navBar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  max-width: 480px;\n  padding: 0.75rem 1rem;\n  background: rgba(255, 255, 255, 0.7);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border: 1px solid rgba(0, 0, 0, 0.08);\n  border-radius: 14px;\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);\n\n  [data-theme='dark'] & {\n    background: rgba(26, 31, 44, 0.7);\n    border: 1px solid rgba(255, 255, 255, 0.1);\n    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);\n  }\n}\n\n.navItems {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n\n.iconButton {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  padding: 0;\n  background: none;\n  border: none;\n  border-radius: 8px;\n  color: var(--text-blue);\n  outline: none;\n\n  svg {\n    width: 20px;\n    height: 20px;\n  }\n}\n\n.iconWrapper {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  will-change: transform;\n}\n\n.pillButton {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 6px 14px;\n  background: none;\n  border: none;\n  border-radius: 8px;\n  color: var(--text-blue);\n  font-size: 15px;\n  font-weight: 500;\n  outline: none;\n}\n";

export const FULL_MULTI_STATE_BADGE_TSX = `'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
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

const springTransition: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 30,
};

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

// Success checkmark icon with animated path drawing
const SuccessIcon = () => (
  <motion.svg {...commonSvgProps}>
    <motion.polyline points="4 12 9 17 20 6" {...pathAnimation} />
  </motion.svg>
);

// Processing spinner icon with continuous rotation and animated arc
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

// Error cross icon with animated two-line drawing
const ErrorIcon = () => (
  <motion.svg {...commonSvgProps}>
    <motion.line x1="6" y1="6" x2="18" y2="18" {...pathAnimation} />
    <motion.line x1="18" y1="6" x2="6" y2="18" {...delayedPathAnimation} />
  </motion.svg>
);

// State icon renderer with slide, blur & scale transitions
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
      <AnimatePresence mode="wait">
        {state !== 'idle' && (
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
        )}
      </AnimatePresence>
    </motion.span>
  );
};

// Animated text label with measured width and smooth blur morph
const BadgeLabel = ({
  state,
  labels,
}: {
  state: MultiStateBadgeState;
  labels: Record<MultiStateBadgeState, string>;
}) => {
  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (measureRef.current) {
      const { width } = measureRef.current.getBoundingClientRect();
      setMeasuredWidth(width);
    }
  }, [state, labels]);

  const currentText = labels[state];

  return (
    <>
      <div ref={measureRef} className={styles.textMeasure}>
        {currentText}
      </div>
      <motion.span
        layout
        className={styles.textContainer}
        animate={{ width: measuredWidth }}
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

// Inner Badge Component with shake / bounce trigger effects
const BadgePill = ({
  state,
  labels,
}: {
  state: MultiStateBadgeState;
  labels: Record<MultiStateBadgeState, string>;
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
      animate={{ gap: state === 'idle' ? 0 : 8 }}
      transition={springTransition}
    >
      <BadgeIcon state={state} />
      <BadgeLabel state={state} labels={labels} />
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

  const mergedLabels: Record<MultiStateBadgeState, string> = {
    ...DEFAULT_LABELS,
    ...customLabels,
  };

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
    <div className={\`\${styles.container} \${className || ''}\`} style={style}>
      <button
        type="button"
        className={styles.badgeButton}
        onClick={handleClick}
        disabled={!interactive}
        aria-label={\`Current status: \${mergedLabels[currentState]}. Click to cycle status.\`}
      >
        <BadgePill state={currentState} labels={mergedLabels} />
      </button>
    </div>
  );
};

export default MultiStateBadge;
`;

export const FULL_MULTI_STATE_BADGE_SCSS = `.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  min-height: 80px;
  position: relative;
}

.badgeButton {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.7);
    outline-offset: 4px;
    border-radius: 999px;
  }
}

.badge {
  background-color: #ffffff;
  color: #0b1012;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 999px;
  will-change: transform, filter;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;

  :global([data-theme='light']) & {
    background-color: #0f172a;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  }
}

.iconContainer {
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.icon {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.textMeasure {
  position: absolute;
  visibility: hidden;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
  pointer-events: none;
}

.textContainer {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 20px;
}

.textItem {
  white-space: nowrap;
  text-overflow: clip;
}
`;

export const FULL_LINE_GRAPH_TSX = `'use client';

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
  return index === 0 ? \`M \${pt.x},\${pt.y}\` : \`\${acc} L \${pt.x},\${pt.y}\`;
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
    return \`\${pathString} L \${lastX},250 L \${firstX},250 Z\`;
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
    return abs >= 100 ? Math.round(abs).toString() : abs.toFixed(1).replace(/\\.0$/, '');
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
      className={\`\${styles.wrapper} \${className || ''}\`}
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
                aria-label={\`Point \${i + 1}: \${pt.value}\`}
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
`;

export const FULL_LINE_GRAPH_SCSS = `.wrapper {
  --hue-6: #8df0cc;
  --hue-1: #ff0088;
  --layer: #13181a;
  --border: #1e2427;
  --card-bg: #13181a;
  --text-main: #f9fafb;

  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 640px;
  background-color: var(--card-bg);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  overflow: visible;
  user-select: none;
  font-family: inherit;
  transition: background-color 0.25s ease, border-color 0.25s ease;

  :global([data-theme='light']) & {
    --hue-6: #059669;
    --hue-1: #e11d48;
    --layer: #ffffff;
    --border: #e2e8f0;
    --card-bg: #ffffff;
    --text-main: #0f172a;

    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
  }
}

.graphSvg {
  overflow: visible;
  width: 100%;
  max-width: 600px;
  height: auto;
  display: block;
}

.tooltip {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--layer);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  will-change: transform;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  :global([data-theme='light']) & {
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  }
}

.arrow {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  will-change: transform, color;
}

.numberValue {
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: center;
  will-change: color;
}

.pointHitbox {
  cursor: pointer;
  outline: none;
}
`;

export const FULL_CHECKBOX_TSX = `'use client';

import React, { useState, useId } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import styles from './Checkbox.module.scss';

export interface MotionCheckboxProps {
  /**
   * Controlled checked state.
   */
  checked?: boolean;
  /**
   * Initial checked state for uncontrolled mode. Defaults to false.
   */
  defaultChecked?: boolean;
  /**
   * Callback fired when checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Whether the checkbox is disabled.
   */
  disabled?: boolean;
  /**
   * Optional custom accent color (e.g. #8df0cc, #6366f1, #06b6d4).
   */
  color?: string;
  /**
   * Size variant: 'sm' (24px), 'md' (32px), 'lg' (40px). Defaults to 'md'.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional label displayed alongside checkbox.
   */
  label?: React.ReactNode;
  /**
   * Unique element id for label association.
   */
  id?: string;
  /**
   * Custom className for root container.
   */
  className?: string;
  /**
   * Custom inline styles for root container.
   */
  style?: React.CSSProperties;
}

export const Checkbox: React.FC<MotionCheckboxProps> = ({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  color,
  size = 'md',
  label,
  id,
  className = '',
  style,
}) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

  // Path length motion value initialized to current checked state
  const pathLength = useMotionValue(isChecked ? 1 : 0);

  // Dynamic stroke-linecap: 'none' when length is 0 (avoids visible dot artifact), 'round' when drawn
  const strokeLinecap = useTransform(() => (pathLength.get() === 0 ? 'none' : 'round'));

  const handleCheckedChange = (nextChecked: boolean) => {
    if (disabled) return;
    if (!isControlled) {
      setInternalChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  };

  const sizeClass = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...(color ? ({ '--hue-6': color } as React.CSSProperties) : {}),
  };

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')} style={containerStyle}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        checked={isChecked}
        onCheckedChange={(checked) => handleCheckedChange(checked === true)}
        disabled={disabled}
        asChild
      >
        <motion.button
          type="button"
          className={[styles.root, sizeClass].filter(Boolean).join(' ')}
          whileHover={disabled ? undefined : { scale: 1.05 }}
          whileTap={disabled ? undefined : { scale: 0.95 }}
          data-primary-action="true"
          aria-label={typeof label === 'string' ? label : 'Checkbox'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--hue-6)"
            strokeWidth="3"
            className={styles.svgIcon}
          >
            <motion.path
              d="M4 12L10 18L20 6"
              initial={false}
              animate={{ pathLength: isChecked ? 1 : 0 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: isChecked ? 0.3 : 0.1,
              }}
              style={{
                pathLength,
                strokeLinecap,
              }}
            />
          </svg>
        </motion.button>
      </CheckboxPrimitive.Root>

      {label && (
        <label
          htmlFor={checkboxId}
          className={[styles.label, disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
`;

export const FULL_CHECKBOX_SCSS = `.container {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  user-select: none;
  font-family: inherit;

  --hue-6: #8df0cc;
  --layer: #13181a;
  --border: #1e2427;
  --text: #ededec;
  --text-muted: #7a8180;

  :global([data-theme='light']) & {
    --hue-6: #059669;
    --layer: #ffffff;
    --border: #e0e0de;
    --text: #1a1a1c;
    --text-muted: #6e6a64;
  }
}

.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: var(--layer);
  border: 1px solid var(--border);
  cursor: pointer;
  padding: 4px;
  box-sizing: border-box;
  color: inherit;
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;

  &:focus-visible {
    outline: none;
    border-color: var(--hue-6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--hue-6) 25%, transparent);
  }

  &[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}

.sizeSm {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  padding: 3px;
}

.sizeMd {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  padding: 4px;
}

.sizeLg {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  padding: 5px;
}

.svgIcon {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  line-height: 1.4;
  transition: color 0.2s ease;

  &.disabled {
    cursor: not-allowed;
    color: var(--text-muted);
  }
}
`;

export const FULL_SMOOTH_TABS_TSX = `'use client';

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
  indicatorSpring?: { stiffness: number; damping: number };
  contentOffsetX?: number;
  contentDuration?: number;
  tabs?: TabItem[];
  activeIndex?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

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
    <div className={\`\${styles.container} \${className}\`} style={style}>
      <div className={styles.card}>
        <div className={styles.segmentedControl}>
          {tabs.map((tab, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={tab.id}
                type="button"
                className={\`\${styles.tabButton} \${isActive ? \`\${styles.active} active\` : ''}\`}
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
`;


export const FULL_SMOOTH_TABS_SCSS = `.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  font-family: inherit;

  --layer: #0f1815;
  --border: #1c2623;
  --white: #ffffff;
  --black: #0b1012;
  --feint-text: #586d8c;
  --hue-1: #ff0088;
  --hue-3: #9911ff;
  --hue-5: #0cdcf7;
  --stat-bg: rgba(158, 234, 247, 0.04);
  --tab-hover: #ffffff;

  :global([data-theme='light']) & {
    --layer: #ffffff;
    --border: #e2e8f0;
    --white: #0f172a;
    --black: #ffffff;
    --feint-text: #64748b;
    --hue-1: #e11d48;
    --hue-3: #7c3aed;
    --hue-5: #0284c7;
    --stat-bg: rgba(15, 23, 42, 0.03);
    --tab-hover: #0f172a;
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: clamp(280px, 90%, 420px);
}

.segmentedControl {
  display: flex;
  padding: 4px;
  border-radius: 12px;
  background-color: var(--layer);
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  position: relative;
}

.tabButton {
  position: relative;
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.2s ease;
  z-index: 1;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--hue-5);
  }

  &:hover {
    color: var(--tab-hover) !important;
  }

  &.active:hover {
    color: var(--black) !important;
  }
}

.tabLabel {
  position: relative;
  z-index: 1;
  pointer-events: none;
  letter-spacing: -0.01em;
}

.indicator {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background-color: var(--white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
}

.contentContainer {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background-color: var(--layer);
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  min-height: 200px;
}

.content {
  padding: 24px;
  will-change: transform, opacity, filter;
  box-sizing: border-box;
}

.contentHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--black);
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--white);
  letter-spacing: -0.01em;
}

.description {
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--feint-text);
}

.statsRow {
  display: flex;
  gap: 1px;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--border);
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
  background-color: var(--stat-bg);
}

.statValue {
  font-size: 20px;
  font-weight: 600;
  color: var(--white);
}

.statLabel {
  font-size: 11px;
  font-weight: 500;
  color: var(--feint-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
`;



