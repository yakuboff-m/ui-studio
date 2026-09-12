'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useMotionValue,
  useTransform,
  type MotionValue,
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
  id: string;
  element: HTMLElement;
  rect: DOMRect;
}

// Exact Motion.dev constants
const DEFAULT_CURSOR_SIZE = 17;
const PADDING = 5; // 5px padding on each side -> +10px total
const SNAP_TRANSITION = { duration: 0.15, ease: [0.38, 0.12, 0.29, 1] } as const;

// Chevron Icon exact SVG from Motion.dev
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

  const [isInside, setIsInside] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [activeTarget, setActiveTarget] = useState<TargetInfo | null>(null);

  // Track active target ID to ensure transitions ONLY trigger once on state changes,
  // preventing constant animation restarts on every mousemove frame
  const currentTargetIdRef = useRef<string | null>(null);

  // Raw mouse coordinates relative to container
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  // Snapped target center coordinates relative to container
  const targetCenterX = useMotionValue(0);
  const targetCenterY = useMotionValue(0);

  // Magnetic weight (0 = free dot following mouse 1:1, 0.8 = snapped with 20% drag resistance)
  const snapWeight = useMotionValue(0);

  // Cursor dimensions (17px free dot, rect.width + 10 / rect.height + 10 when snapped)
  const cursorWidth = useMotionValue(DEFAULT_CURSOR_SIZE);
  const cursorHeight = useMotionValue(DEFAULT_CURSOR_SIZE);

  // Computed cursor position via transform interpolation
  const cursorX = useTransform(() => {
    const px = pointerX.get();
    const tx = targetCenterX.get();
    const w = snapWeight.get();
    return px + (tx - px) * w;
  });

  const cursorY = useTransform(() => {
    const py = pointerY.get();
    const ty = targetCenterY.get();
    const w = snapWeight.get();
    return py + (ty - py) * w;
  });

  // Per-target magnetic parallax pure motion values (id -> { x: MotionValue, y: MotionValue })
  const targetsMap = useRef<Map<string, { x: MotionValue<number>; y: MotionValue<number> }>>(new Map());

  const getTargetMotion = useCallback((id: string) => {
    let entry = targetsMap.current.get(id);
    if (!entry) {
      entry = {
        x: motionValue(0),
        y: motionValue(0),
      };
      targetsMap.current.set(id, entry);
    }
    return entry;
  }, []);

  // Fast, accurate target detection
  const checkTargetUnderPointer = useCallback((clientX: number, clientY: number): TargetInfo | null => {
    const container = containerRef.current;
    if (!container) return null;

    const interactiveElements = container.querySelectorAll<HTMLElement>(
      'button, [data-cursor="pointer"]'
    );

    const threshold = 4; // Tight, instant proximity activation
    for (const el of Array.from(interactiveElements)) {
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left - threshold &&
        clientX <= rect.right + threshold &&
        clientY >= rect.top - threshold &&
        clientY <= rect.bottom + threshold
      ) {
        const id = el.getAttribute('data-pointer-id') || el.innerText || 'target';
        return { id, element: el, rect };
      }
    }
    return null;
  }, []);

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const cRect = container.getBoundingClientRect();
      const localX = e.clientX - cRect.left;
      const localY = e.clientY - cRect.top;

      if (!isInside) {
        pointerX.jump(localX);
        pointerY.jump(localY);
        setIsInside(true);
      } else {
        pointerX.set(localX);
        pointerY.set(localY);
      }

      const target = checkTargetUnderPointer(e.clientX, e.clientY);
      const targetId = target ? target.id : null;

      // CRITICAL: Only trigger shape & snap animations when the target actually changes!
      // Calling animate() on every single mousemove cancels and restarts the 150ms ease,
      // which previously caused the sluggish morphing reported by the user.
      if (targetId !== currentTargetIdRef.current) {
        currentTargetIdRef.current = targetId;
        setActiveTarget(target);

        if (target) {
          const rect = target.rect;
          const cX = rect.left - cRect.left + rect.width / 2;
          const cY = rect.top - cRect.top + rect.height / 2;

          targetCenterX.set(cX);
          targetCenterY.set(cY);

          const targetW = rect.width + PADDING * 2;
          const targetH = rect.height + PADDING * 2;

          animate(cursorWidth, targetW, SNAP_TRANSITION);
          animate(cursorHeight, targetH, SNAP_TRANSITION);
          animate(snapWeight, 0.8, SNAP_TRANSITION);
        } else {
          // Instant return to 17px circle
          animate(cursorWidth, DEFAULT_CURSOR_SIZE, SNAP_TRANSITION);
          animate(cursorHeight, DEFAULT_CURSOR_SIZE, SNAP_TRANSITION);
          animate(snapWeight, 0, SNAP_TRANSITION);

          targetsMap.current.forEach((tMotion) => {
            if (tMotion.x.get() !== 0 || tMotion.y.get() !== 0) {
              animate(tMotion.x, 0, SNAP_TRANSITION);
              animate(tMotion.y, 0, SNAP_TRANSITION);
            }
          });
        }
      } else if (target) {
        // Target is already active: continuously track position & calculate magnetic parallax
        const rect = target.rect;
        const cX = rect.left - cRect.left + rect.width / 2;
        const cY = rect.top - cRect.top + rect.height / 2;

        targetCenterX.set(cX);
        targetCenterY.set(cY);

        const dx = localX - cX;
        const dy = localY - cY;
        const pullX = magneticStrength * dx;
        const pullY = magneticStrength * dy;

        const activeMotion = targetsMap.current.get(target.id);
        if (activeMotion) {
          activeMotion.x.set(pullX);
          activeMotion.y.set(pullY);
        }
      }
    },
    [
      isInside,
      pointerX,
      pointerY,
      targetCenterX,
      targetCenterY,
      cursorWidth,
      cursorHeight,
      snapWeight,
      checkTargetUnderPointer,
      magneticStrength,
    ]
  );

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      pointerX.jump(e.clientX - cRect.left);
      pointerY.jump(e.clientY - cRect.top);
    }
    setIsInside(true);
  };

  const handlePointerLeave = () => {
    setIsInside(false);
    setActiveTarget(null);
    currentTargetIdRef.current = null;
    cursorWidth.set(DEFAULT_CURSOR_SIZE);
    cursorHeight.set(DEFAULT_CURSOR_SIZE);
    snapWeight.set(0);
    targetsMap.current.forEach((tMotion) => {
      tMotion.x.set(0);
      tMotion.y.set(0);
    });
  };

  const handlePointerDown = () => {
    setIsPressed(true);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  // Keep target rect updated on window resize or scroll
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeTarget && activeTarget.element && containerRef.current) {
        const updatedRect = activeTarget.element.getBoundingClientRect();
        const cRect = containerRef.current.getBoundingClientRect();
        setActiveTarget((prev) => (prev ? { ...prev, rect: updatedRect } : null));
        targetCenterX.set(updatedRect.left - cRect.left + updatedRect.width / 2);
        targetCenterY.set(updatedRect.top - cRect.top + updatedRect.height / 2);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeTarget, targetCenterX, targetCenterY]);

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
            data-pointer-id="single-appearance"
            className={styles.button}
            whileTap="pressed"
            type="button"
            data-cursor="pointer"
          >
            <motion.span
              className={styles.buttonLabel}
              variants={{ pressed: { scale: 0.95 } }}
              style={{
                x: getTargetMotion('single-appearance').x,
                y: getTargetMotion('single-appearance').y,
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
              data-pointer-id="nav-appearance"
              className={styles.button}
              style={{ fontSize: 18, padding: '4px 8px' }}
              whileTap="pressed"
              type="button"
              data-cursor="pointer"
            >
              <motion.span
                className={styles.buttonLabel}
                variants={{ pressed: { scale: 0.95 } }}
                style={{
                  x: getTargetMotion('nav-appearance').x,
                  y: getTargetMotion('nav-appearance').y,
                }}
              >
                <ChevronLeft />
                <span>{label}</span>
              </motion.span>
            </motion.button>

            <div className={styles.navItems}>
              <motion.button
                data-pointer-id="nav-share"
                className={styles.iconButton}
                whileTap="pressed"
                type="button"
                data-cursor="pointer"
                aria-label="Share"
              >
                <motion.span
                  className={styles.iconWrapper}
                  variants={{ pressed: { scale: 0.95 } }}
                  style={{
                    x: getTargetMotion('nav-share').x,
                    y: getTargetMotion('nav-share').y,
                  }}
                >
                  <ShareIcon />
                </motion.span>
              </motion.button>

              <motion.button
                data-pointer-id="nav-settings"
                className={styles.iconButton}
                whileTap="pressed"
                type="button"
                data-cursor="pointer"
                aria-label="Settings"
              >
                <motion.span
                  className={styles.iconWrapper}
                  variants={{ pressed: { scale: 0.95 } }}
                  style={{
                    x: getTargetMotion('nav-settings').x,
                    y: getTargetMotion('nav-settings').y,
                  }}
                >
                  <SettingsIcon />
                </motion.span>
              </motion.button>

              <motion.button
                data-pointer-id="nav-done"
                className={styles.pillButton}
                whileTap="pressed"
                type="button"
                data-cursor="pointer"
              >
                <motion.span
                  variants={{ pressed: { scale: 0.95 } }}
                  style={{
                    display: 'inline-block',
                    willChange: 'transform',
                    x: getTargetMotion('nav-done').x,
                    y: getTargetMotion('nav-done').y,
                  }}
                >
                  Done
                </motion.span>
              </motion.button>
            </div>
          </div>
        )}

        {mode === 'segmented' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <motion.button
              ref={primaryButtonRef}
              data-pointer-id="seg-appearance"
              className={styles.button}
              whileTap="pressed"
              type="button"
              data-cursor="pointer"
            >
              <motion.span
                className={styles.buttonLabel}
                variants={{ pressed: { scale: 0.95 } }}
                style={{
                  x: getTargetMotion('seg-appearance').x,
                  y: getTargetMotion('seg-appearance').y,
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
              {['Display', 'Sounds', 'Haptics'].map((item) => {
                const segId = `seg-item-${item.toLowerCase()}`;
                return (
                  <motion.button
                    key={item}
                    data-pointer-id={segId}
                    className={styles.pillButton}
                    whileTap="pressed"
                    type="button"
                    data-cursor="pointer"
                  >
                    <motion.span
                      variants={{ pressed: { scale: 0.95 } }}
                      style={{
                        display: 'inline-block',
                        willChange: 'transform',
                        x: getTargetMotion(segId).x,
                        y: getTargetMotion(segId).y,
                      }}
                    >
                      {item}
                    </motion.span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating / Morphed iOS Pointer */}
      <AnimatePresence>
        {isInside && (
          <motion.div
            className={`${styles.cursor} ${activeTarget ? styles.cursorSnapped : ''}`}
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: 1,
              scale: isPressed ? 0.9 : 1,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.15 }}
            transformTemplate={(_props, generated) => `translate(-50%, -50%) ${generated}`}
            style={{
              x: cursorX,
              y: cursorY,
              width: cursorWidth,
              height: cursorHeight,
              borderRadius: 10,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IosPointer;
