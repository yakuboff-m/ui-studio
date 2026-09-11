'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';
import styles from './FooterReveal.module.scss';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export interface FooterColumn {
  title: string;
  links: string[];
}

export interface FooterRevealProps {
  /** Top dossier kicker text */
  kicker?: string;
  /** Top dossier prompt text */
  prompt?: string;
  /** Brand wordmark */
  brandName?: string;
  /** Brand description / tagline */
  brandDescription?: string;
  /** Nav columns in footer */
  columns?: FooterColumn[];
  /** Copyright text */
  copyright?: string;
  /** Legal links */
  legalLinks?: string[];
  /** Theme: 'auto' | 'dark' | 'light' (Dark by default) */
  theme?: 'auto' | 'dark' | 'light';
  /** Accent fruit color: 'blueberry' | 'strawberry' | 'emerald' | 'amber' | 'violet' */
  footerColor?: 'blueberry' | 'strawberry' | 'emerald' | 'amber' | 'violet';
  /** Scroll target: 'container' (self-contained scrollable box) or 'window' (full browser page) */
  scrollTarget?: 'container' | 'window';
  /** Container height if scrollTarget === 'container' (e.g. '680px' or '100%') */
  containerHeight?: string | number;
  /** Optional custom containerRef */
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: ['Funnels', 'Retention alerts', 'Cohorts', 'Session replay'],
  },
  {
    title: 'Developers',
    links: ['Docs', 'API reference', 'SDKs', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Customers', 'Blog'],
  },
];

const DEFAULT_LEGAL_LINKS = ['Privacy', 'Terms', 'Security'];

export const FooterReveal: React.FC<FooterRevealProps> = ({
  kicker = 'Footer reveal',
  prompt = 'Scroll down',
  brandName = 'Velocity',
  brandDescription = 'Trace each session to the step that breaks, without another dashboard nobody opens.',
  columns = DEFAULT_FOOTER_COLUMNS,
  copyright = '© 2026 Velocity Analytics, Inc. All rights reserved.',
  legalLinks = DEFAULT_LEGAL_LINKS,
  theme = 'dark',
  footerColor = 'blueberry',
  scrollTarget = 'container',
  containerHeight = '680px',
  containerRef,
  className,
  style,
}) => {
  const contentRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);

  // When scrollTarget is 'container', use internal or provided ref
  const effectiveContainerRef =
    containerRef || (scrollTarget === 'container' ? internalContainerRef : undefined);

  const [revealAt, setRevealAt] = useState(0.35);

  useIsomorphicLayoutEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const update = () => {
      const footerHeight = footer.offsetHeight;
      const container = effectiveContainerRef?.current;
      const viewportHeight = container
        ? container.clientHeight
        : (typeof window !== 'undefined' ? window.innerHeight : 1) || 1;

      setRevealAt(
        Math.min(0.95, Math.max(0.05, footerHeight / viewportHeight))
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(footer);
    if (effectiveContainerRef?.current) {
      observer.observe(effectiveContainerRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [effectiveContainerRef]);

  const { scrollYProgress } = useScroll({
    target: contentRef,
    container: effectiveContainerRef,
    offset: ['end end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, revealAt], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, revealAt], [0.9, 1]);
  const blur = useTransform(scrollYProgress, [0, revealAt], [6, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  const opacityWillChange = useTransform(scrollYProgress, (val) =>
    val > 0.0001 && val < revealAt ? 'opacity' : 'auto'
  );
  const contentWillChange = useTransform(scrollYProgress, (val) =>
    val > 0.0001 && val < revealAt ? 'transform, filter' : 'auto'
  );

  // Resolved theme
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>(
    theme === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    if (theme === 'auto') {
      const checkTheme = () => {
        const docTheme = document.documentElement.getAttribute('data-theme');
        setActiveTheme(docTheme === 'light' ? 'light' : 'dark');
      };
      checkTheme();
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
      return () => observer.disconnect();
    } else {
      setActiveTheme(theme);
    }
  }, [theme]);

  const innerContent = (
    <div
      className={`${styles.root} ${className || ''}`}
      data-theme={activeTheme}
      data-color={footerColor}
      style={style}
    >
      <main ref={contentRef} className={styles.content}>
        <div className={styles.dossier}>
          <div className={styles.dossierInner}>
            <p className={styles.kicker}>{kicker}</p>
            <p className={styles.prompt}>{prompt}</p>
            <div className={styles.hintScroll}>
              <span>Scroll to unveil footer</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </main>

      <footer ref={footerRef} className={styles.revealFooter}>
        <motion.div
          className={styles.footerFade}
          style={{ opacity, willChange: opacityWillChange }}
        >
          <motion.div
            className={styles.footerScale}
            style={{
              scale,
              filter,
              transformOrigin: '50% 100%',
              willChange: contentWillChange,
            }}
          >
            <div className={styles.footerInner}>
              <div className={styles.footerBrand}>
                <span className={styles.velocityWordmark}>{brandName}</span>
                <p>{brandDescription}</p>
              </div>

              <div className={styles.footerCols}>
                {columns.map((column) => (
                  <div key={column.title} className={styles.footerCol}>
                    <h3>{column.title}</h3>
                    <ul>
                      {column.links.map((link) => (
                        <li key={link}>
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className={styles.footerLegal}>
                <span>{copyright}</span>
                <ul>
                  {legalLinks.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </footer>
    </div>
  );

  if (scrollTarget === 'container') {
    return (
      <div
        ref={internalContainerRef}
        className={styles.scrollContainer}
        style={containerHeight ? { height: containerHeight } : undefined}
      >
        {innerContent}
      </div>
    );
  }

  return innerContent;
};
