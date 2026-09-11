'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './NavbarHover.module.scss';

/* ── Types ── */
export interface NavbarHoverItem {
  label: string;
  href?: string;
}

export interface NavbarHoverProps {
  /** Logo text shown next to the icon */
  logoText?: string;
  /** Nav link items */
  navItems?: NavbarHoverItem[];
  /** CTA button label */
  ctaLabel?: string;
  /** Called when CTA is clicked */
  onCtaClick?: () => void;
  /** 'auto' | 'dark' | 'light' */
  theme?: 'auto' | 'dark' | 'light';
  style?: React.CSSProperties;
  className?: string;
}

const DEFAULT_NAV_ITEMS: NavbarHoverItem[] = [
  { label: 'Work', href: '#' },
  { label: 'Services', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Contact', href: '#' },
];

/* ── Logo SVG (matches Aceternity "A" monogram) ── */
function LogoIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="7" fill="white" />
      <path
        d="M14 6L20.5 20H17.5L14 12.5L10.5 20H7.5L14 6Z"
        fill="#111"
      />
    </svg>
  );
}

/* ── Main component ── */
export function NavbarHover({
  logoText = 'DevStudio',
  navItems = DEFAULT_NAV_ITEMS,
  ctaLabel = 'Book a call',
  onCtaClick,
  theme = 'auto',
  style,
  className,
}: NavbarHoverProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /* Pill geometry — we track the bounding rect of each nav item */
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  /* Pill position in px relative to the nav list container */
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({
    opacity: 0,
    width: 0,
    transform: 'translateX(0px)',
  });

  const updatePill = useCallback(
    (index: number | null) => {
      if (index === null || !navRef.current) {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const el = itemRefs.current[index];
      if (!el || !navRef.current) return;

      const navRect = navRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      const left = elRect.left - navRect.left;
      const width = elRect.width;

      setPillStyle({
        opacity: 1,
        width,
        transform: `translateX(${left}px)`,
      });
    },
    []
  );

  useEffect(() => {
    updatePill(hoveredIndex);
  }, [hoveredIndex, updatePill]);

  const dataTheme = theme === 'auto' ? undefined : theme;

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-theme={dataTheme}
      style={style}
    >
      <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <div className={styles.logo}>
          <LogoIcon />
          <span className={styles.logoText}>{logoText}</span>
        </div>

        {/* Nav links + sliding pill */}
        <div
          className={styles.navList}
          ref={navRef}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Sliding pill indicator */}
          <span
            className={styles.pill}
            style={pillStyle}
            aria-hidden="true"
          />

          {navItems.map((item, i) => (
            <a
              key={item.label}
              href={item.href ?? '#'}
              ref={(el) => { itemRefs.current[i] = el; }}
              className={styles.navLink}
              onMouseEnter={() => setHoveredIndex(i)}
              onClick={(e) => e.preventDefault()}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          className={styles.cta}
          onClick={onCtaClick}
          id="navbar-hover-cta"
        >
          {ctaLabel}
        </button>
      </nav>
    </div>
  );
}
