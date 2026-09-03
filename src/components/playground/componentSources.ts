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
