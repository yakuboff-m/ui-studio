'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { SmoothInput } from '../SmoothInput';
import styles from './MarketplaceDock.module.scss';

const SPRING       = { type: 'spring', bounce: 0, duration: 0.4 } as const;
const LABEL_SPRING = { type: 'spring', bounce: 0, duration: 0.4 } as const;

const PANEL_VARIANTS = {
  initial: (dir: number) => ({ x: `${100 * dir}%`, opacity: 0 }),
  active:  { x: '0%', opacity: 1 },
  exit:    (dir: number) => ({ x: `${-100 * dir}%`, opacity: 0 }),
};

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

  const exitSearch = () => {
    setIsSearch(false);
    setSearchQuery('');
  };

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
  }, [isSearch]);

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
    <div className={styles.wrapper}>
      <div ref={containerRef} className="flex items-end justify-center">
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
                                  className={`${styles.blockOption} ${
                                    sortBy === opt.id ? styles.blockOptionActive : ''
                                  }`}
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
                                  className={`${styles.blockOption} ${
                                    expiryStatus === opt.id ? styles.blockOptionActive : ''
                                  }`}
                                >
                                  <span className={`${styles.blockDot} ${opt.dotClass}`} />
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
              <AnimatePresence mode="wait" initial={false}>
                {isSearch ? (
                  /* Search input mode */
                  <motion.div
                    key="search-mode"
                    className={styles.searchRow}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <Search size={15} className={styles.searchIcon} />
                    <SmoothInput
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search products…"
                      className={styles.searchInput}
                      isDockMode
                      onKeyDown={e => e.key === 'Escape' && exitSearch()}
                    />
                    <button className={styles.searchClose} onClick={exitSearch} type="button">
                      <X size={15} />
                    </button>
                  </motion.div>
                ) : (
                  /* Normal dock buttons */
                  <motion.div
                    key="normal-dock"
                    className={styles.tabList}
                    role="tablist"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {DOCK_BUTTONS.map(btn => {
                      const active = isButtonActive(btn.id);
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
                          className={`${styles.tabButton} ${active ? styles.activeTab : ''}`}
                        >
                          <span className={styles.iconSpan}>
                            {btn.icon}
                          </span>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </MotionConfig>
      </div>
    </div>
  );
};
