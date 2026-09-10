'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion, useSpring } from 'framer-motion';
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
      className={`${styles.desktopSidebar} ${className}`}
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
            className={`${styles.mobileDrawer} ${className}`}
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
  linkRef?: React.RefObject<HTMLAnchorElement | null>;
  isHovered?: boolean;
  onHover?: (ref: React.RefObject<HTMLAnchorElement | null> | null) => void;
  className?: string;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({
  link,
  linkRef,
  isHovered,
  onHover,
  className = '',
}) => {
  const { open } = useSidebar();

  return (
    <a
      ref={linkRef}
      href={link.href}
      className={`${styles.sidebarLink} ${isHovered ? styles.sidebarLinkHovered : ''} ${className}`}
      onMouseEnter={() => {
        if (onHover && linkRef) onHover(linkRef);
      }}
      onMouseLeave={() => {
        if (onHover) onHover(null);
      }}
    >
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

/* ─── Hover Pill Nav — renders one shared pill that slides between links ─── */
export interface HoverPillNavProps {
  links: SidebarLinkItem[];
  idPrefix: string;
  className?: string;
}

export const HoverPillNav: React.FC<HoverPillNavProps> = ({ links, idPrefix, className = '' }) => {
  const navRef = useRef<HTMLDivElement>(null);
  // One ref per link
  const linkRefs = useRef<Array<React.RefObject<HTMLAnchorElement | null>>>(links.map(() => React.createRef()));

  // Springs for pill top, height (width/left tracked by CSS inset: 0)
  const pillTop = useSpring(0, { stiffness: 400, damping: 30, mass: 0.8 });
  const pillHeight = useSpring(0, { stiffness: 400, damping: 30, mass: 0.8 });
  const pillOpacity = useSpring(0, { stiffness: 400, damping: 30 });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleHover = useCallback(
    (ref: React.RefObject<HTMLAnchorElement | null> | null) => {
      if (!ref || !ref.current || !navRef.current) {
        pillOpacity.set(0);
        setHoveredIdx(null);
        return;
      }
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = ref.current.getBoundingClientRect();
      pillTop.set(linkRect.top - navRect.top);
      pillHeight.set(linkRect.height);
      pillOpacity.set(1);
      const idx = linkRefs.current.findIndex((r) => r === ref);
      setHoveredIdx(idx);
    },
    [pillTop, pillHeight, pillOpacity]
  );

  return (
    <div ref={navRef} className={`${styles.linksContainer} ${className}`} style={{ position: 'relative' }}>
      {/* Single shared pill — persists in DOM and slides smoothly */}
      <motion.div
        className={styles.hoverPill}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: pillTop,
          height: pillHeight,
          opacity: pillOpacity,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {links.map((link, i) => (
        <SidebarLink
          key={link.label}
          link={link}
          linkRef={linkRefs.current[i]}
          isHovered={hoveredIdx === i}
          onHover={handleHover}
        />
      ))}
    </div>
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
    <a href={href} className={`${styles.logo} ${className}`}>
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
    <div className={`${styles.profileSection} ${className}`}>
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
            <div key={`metric-${i}`} className={styles.skeletonCard} />
          ))}
        </div>
        {/* 2 Main content pulse cards */}
        <div className={styles.skeletonMainGrid}>
          {[...Array(2)].map((_, i) => (
            <div key={`main-${i}`} className={styles.skeletonMain} />
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
      className={`${styles.sidebarLayout} ${className}`}
      data-theme={dataThemeAttr}
      style={style}
    >
      <Sidebar collapsible={collapsible}>
        <SidebarBody>
          <div>
            <SidebarLogo title={logoTitle} />

            <HoverPillNav links={primaryLinks} idPrefix="pri" />

            <div className={styles.divider} />

            <HoverPillNav links={secondaryLinks} idPrefix="sec" />
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
