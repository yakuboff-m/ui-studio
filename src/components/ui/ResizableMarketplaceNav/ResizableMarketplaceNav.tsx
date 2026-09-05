'use client';

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
  const filterId = `gooey-morph-${uid}`;

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
    <div className={`${styles.viewportFrame} ${className}`}>
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
                <span className={styles.cardTag} style={{ backgroundColor: `${p.badgeColor}20`, color: p.badgeColor }}>{p.tag}</span>
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
          <div className={styles.gooeyWrap} style={{ filter: `url(#${filterId})` }}>

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
                                            className={`${styles.optBtn} ${sortBy === o.id ? styles.optActive : ''}`}>
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
                                            className={`${styles.optBtn} ${expiryStatus === o.id ? styles.optActive : ''}`}>
                                            <span className={`${styles.optDot} ${styles[o.cls]}`} /><span>{o.label}</span>
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
                                className={`${styles.tabBtn} ${active ? styles.tabActive : ''}`}>
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
