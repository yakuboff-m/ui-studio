'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import styles from './IosPointer.module.scss';

export interface IosPointerProps {
  /** Text label on the primary iOS button (default: "Appearance") */
  label?: string;
  /** Demo presentation mode: 'single' | 'navbar' | 'segmented' */
  mode?: 'single' | 'navbar' | 'segmented';
  /** Theme: 'dark' | 'light' | 'auto' */
  theme?: 'dark' | 'light' | 'auto';
  /** Magnetic text pull factor (default: 0.1) */
  magneticStrength?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface TargetInfo {
  element: HTMLElement;
  rect: DOMRect;
  borderRadius: number;
}

// Chevron Icon exact SVG from motion.dev example
function ChevronLeft() {
  return (
    <svg
      className={styles.chevronIcon}
      width="12"
      height="20"
      viewBox="0 0 12 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 2L2 10L10 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Gear Icon for navbar mode
function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Share Icon
function ShareIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export const IosPointer: React.FC<IosPointerProps> = ({
  label = 'Appearance',
  mode = 'single',
  theme = 'auto',
  magneticStrength = 0.1,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // Theme management
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

  // Pointer position raw motion values
  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);
  const [isInside, setIsInside] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Active magnetic target
  const [activeTarget, setActiveTarget] = useState<TargetInfo | null>(null);

  // Spring physics for pointer follower
  const springX = useSpring(pointerX, { stiffness: 1000, damping: 80 });
  const springY = useSpring(pointerY, { stiffness: 1000, damping: 80 });

  // Cursor dimensions
  const cursorWidth = useMotionValue(18);
  const cursorHeight = useMotionValue(18);
  const cursorRadius = useMotionValue(999);
  const cursorScale = useMotionValue(1);

  // Magnetic displacement of the active button's label
  const labelOffsetX = useMotionValue(0);
  const labelOffsetY = useMotionValue(0);

  // Target registration and magnetic check
  const checkTargetUnderPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;

      const interactiveElements = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [data-cursor="pointer"]'
      );

      for (const el of Array.from(interactiveElements)) {
        const rect = el.getBoundingClientRect();
        // Generous magnetic activation threshold (padding of 12px)
        const threshold = 12;
        if (
          clientX >= rect.left - threshold &&
          clientX <= rect.right + threshold &&
          clientY >= rect.top - threshold &&
          clientY <= rect.bottom + threshold
        ) {
          const computed = window.getComputedStyle(el);
          const rawRadius = parseInt(computed.borderRadius, 10);
          return {
            element: el,
            rect,
            borderRadius: isNaN(rawRadius) ? 10 : Math.max(rawRadius, 8),
          };
        }
      }
      return null;
    },
    []
  );

  // Handle pointer movement within container
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      if (!isInside) setIsInside(true);

      const cRect = container.getBoundingClientRect();
      const localX = e.clientX - cRect.left;
      const localY = e.clientY - cRect.top;

      pointerX.set(localX);
      pointerY.set(localY);

      const target = checkTargetUnderPointer(e.clientX, e.clientY);
      setActiveTarget(target);

      if (target) {
        const rect = target.rect;
        const targetCenterX = rect.left - cRect.left + rect.width / 2;
        const targetCenterY = rect.top - cRect.top + rect.height / 2;

        // Snapped dimensions with padding (5px on each side)
        const targetW = rect.width + 10;
        const targetH = rect.height + 10;
        const targetR = target.borderRadius + 2;

        animate(cursorWidth, targetW, { type: 'spring', stiffness: 600, damping: 45 });
        animate(cursorHeight, targetH, { type: 'spring', stiffness: 600, damping: 45 });
        animate(cursorRadius, targetR, { type: 'spring', stiffness: 600, damping: 45 });

        // Magnetic resistance drag on cursor center (snap factor 0.8)
        const dx = localX - targetCenterX;
        const dy = localY - targetCenterY;
        const magneticCursorX = targetCenterX + 0.2 * dx;
        const magneticCursorY = targetCenterY + 0.2 * dy;

        springX.set(magneticCursorX);
        springY.set(magneticCursorY);

        // Magnetic pull on button text
        const pullX = magneticStrength * dx;
        const pullY = magneticStrength * dy;
        animate(labelOffsetX, pullX, { duration: 0.1, ease: 'easeOut' });
        animate(labelOffsetY, pullY, { duration: 0.1, ease: 'easeOut' });
      } else {
        // Free-floating dot
        animate(cursorWidth, 18, { type: 'spring', stiffness: 600, damping: 45 });
        animate(cursorHeight, 18, { type: 'spring', stiffness: 600, damping: 45 });
        animate(cursorRadius, 999, { type: 'spring', stiffness: 600, damping: 45 });

        springX.set(localX);
        springY.set(localY);

        // Reset label offset
        animate(labelOffsetX, 0, { type: 'spring', stiffness: 600, damping: 40 });
        animate(labelOffsetY, 0, { type: 'spring', stiffness: 600, damping: 40 });
      }
    },
    [
      isInside,
      pointerX,
      pointerY,
      checkTargetUnderPointer,
      cursorWidth,
      cursorHeight,
      cursorRadius,
      springX,
      springY,
      magneticStrength,
      labelOffsetX,
      labelOffsetY,
    ]
  );

  const handlePointerEnter = () => {
    setIsInside(true);
  };

  const handlePointerLeave = () => {
    setIsInside(false);
    setActiveTarget(null);
    animate(labelOffsetX, 0, { type: 'spring', stiffness: 600, damping: 40 });
    animate(labelOffsetY, 0, { type: 'spring', stiffness: 600, damping: 40 });
  };

  const handlePointerDown = () => {
    setIsPressed(true);
    animate(cursorScale, 0.92, { duration: 0.1 });
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    animate(cursorScale, 1, { type: 'spring', stiffness: 500, damping: 25 });
  };

  // Keep target rect updated on window resize or scroll
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeTarget && activeTarget.element) {
        const updatedRect = activeTarget.element.getBoundingClientRect();
        setActiveTarget((prev) => (prev ? { ...prev, rect: updatedRect } : null));
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeTarget]);

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${className || ''}`}
      data-theme={activeTheme}
      style={style}
      onPointerMove={handlePointerMove}
      onMouseMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onMouseEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onMouseLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onMouseDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onMouseUp={handlePointerUp}
    >
      <div className={styles.container}>
        {mode === 'single' && (
          <motion.button
            ref={primaryButtonRef}
            className={styles.button}
            whileTap={{ scale: 0.95 }}
            type="button"
            data-cursor="pointer"
          >
            <motion.span
              className={styles.buttonLabel}
              style={{
                x: labelOffsetX,
                y: labelOffsetY,
              }}
            >
              <ChevronLeft />
              <span>{label}</span>
            </motion.span>
          </motion.button>
        )}

        {mode === 'navbar' && (
          <div className={styles.navBar}>
            <motion.button
              ref={primaryButtonRef}
              className={styles.button}
              style={{ fontSize: 18, padding: '4px 8px' }}
              whileTap={{ scale: 0.95 }}
              type="button"
              data-cursor="pointer"
            >
              <motion.span
                className={styles.buttonLabel}
                style={{
                  x: labelOffsetX,
                  y: labelOffsetY,
                }}
              >
                <ChevronLeft />
                <span>{label}</span>
              </motion.span>
            </motion.button>

            <div className={styles.navItems}>
              <motion.button
                className={styles.iconButton}
                whileTap={{ scale: 0.95 }}
                type="button"
                data-cursor="pointer"
                aria-label="Share"
              >
                <ShareIcon />
              </motion.button>

              <motion.button
                className={styles.iconButton}
                whileTap={{ scale: 0.95 }}
                type="button"
                data-cursor="pointer"
                aria-label="Settings"
              >
                <SettingsIcon />
              </motion.button>

              <motion.button
                className={styles.pillButton}
                whileTap={{ scale: 0.95 }}
                type="button"
                data-cursor="pointer"
              >
                Done
              </motion.button>
            </div>
          </div>
        )}

        {mode === 'segmented' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <motion.button
              ref={primaryButtonRef}
              className={styles.button}
              whileTap={{ scale: 0.95 }}
              type="button"
              data-cursor="pointer"
            >
              <motion.span
                className={styles.buttonLabel}
                style={{
                  x: labelOffsetX,
                  y: labelOffsetY,
                }}
              >
                <ChevronLeft />
                <span>{label}</span>
              </motion.span>
            </motion.button>

            <div
              style={{
                display: 'inline-flex',
                gap: 8,
                padding: '6px',
                background: activeTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                borderRadius: 12,
              }}
            >
              {['Display', 'Sounds', 'Haptics'].map((item) => (
                <motion.button
                  key={item}
                  className={styles.pillButton}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  data-cursor="pointer"
                >
                  {item}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.hint}>
          Hover near the button to experience authentic iPadOS / iOS magnetic snapping & parallax
        </div>
      </div>

      {/* Floating / Morphed iOS Pointer */}
      <AnimatePresence>
        {isInside && (
          <motion.div
            className={`${styles.cursor} ${activeTarget ? styles.cursorSnapped : ''}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: isPressed ? 0.93 : 1,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            transformTemplate={({ x, y, scale }) =>
              `translate(-50%, -50%) translate3d(${x}, ${y}, 0) scale(${scale || 1})`
            }
            style={{
              x: springX,
              y: springY,
              width: cursorWidth,
              height: cursorHeight,
              borderRadius: cursorRadius,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default IosPointer;
