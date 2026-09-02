'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import styles from './GooeyInput.module.scss';

/* ─── Gooey SVG Filter ─── */
function GooeyFilter({ filterId, blur = 6 }: { filterId: string; blur?: number }) {
  return (
    <svg className={styles.filterSvg} aria-hidden="true">
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
  mass: 0.8,
};

export interface GooeyInputProps {
  /** Placeholder text shown inside the input */
  placeholder?: string;
  /** Width of the component when collapsed (in px, default 150) */
  collapsedWidth?: number;
  /** Width of the expanded input pill (in px, default 280) */
  expandedWidth?: number;
  /** SVG Gaussian blur amount for the gooey effect (default 6) */
  gooeyBlur?: number;
  /** Controlled value */
  value?: string;
  /** Initial uncontrolled value */
  defaultValue?: string;
  /** Callback fired when value changes */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Callback fired with the new text string */
  onValueChange?: (value: string) => void;
  /** Callback fired when user presses Enter or clicks submit */
  onSubmit?: (value: string) => void;
  /** Callback fired when expansion state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Show right action submit button when text is present */
  showSubmitButton?: boolean;
  /** Custom wrapper class */
  className?: string;
}

export type GooeyInputHandle = {
  focus: () => void;
  clear: () => void;
  expand: () => void;
  collapse: () => void;
  getValue: () => string;
};

export const GooeyInput = forwardRef<GooeyInputHandle, GooeyInputProps>(
  (
    {
      placeholder = 'Type to search…',
      collapsedWidth = 150,
      expandedWidth = 280,
      gooeyBlur = 6,
      value: controlledValue,
      defaultValue = '',
      onChange,
      onValueChange,
      onSubmit,
      onOpenChange,
      disabled = false,
      showSubmitButton = true,
      className = '',
    },
    ref
  ) => {
    const reactId = useId();
    const safeId = reactId.replace(/[^a-zA-Z0-9]/g, '');
    const filterId = `gooey-filter-${safeId}`;
    const iconLayoutId = `gooey-icon-${safeId}`;

    const [isExpanded, setIsExpanded] = useState(false);
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

    const isControlled = controlledValue !== undefined;
    const inputValue = isControlled ? controlledValue : uncontrolledValue;

    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const setExpanded = useCallback(
      (nextState: boolean) => {
        if (disabled) return;
        setIsExpanded(nextState);
        onOpenChange?.(nextState);
      },
      [disabled, onOpenChange]
    );

    const setInputValue = useCallback(
      (nextVal: string) => {
        if (!isControlled) setUncontrolledValue(nextVal);
        onValueChange?.(nextVal);
      },
      [isControlled, onValueChange]
    );

    const handleExpand = useCallback(() => {
      if (disabled || isExpanded) return;
      setExpanded(true);
    }, [disabled, isExpanded, setExpanded]);

    const handleCollapse = useCallback(() => {
      setExpanded(false);
    }, [setExpanded]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (inputValue) {
          setInputValue('');
        } else {
          handleCollapse();
        }
      } else if (e.key === 'Enter') {
        onSubmit?.(inputValue);
      }
    };

    const handleSubmit = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSubmit?.(inputValue);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setInputValue('');
      inputRef.current?.focus();
    };

    /* Focus on expand */
    useEffect(() => {
      if (isExpanded) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 60);
        return () => clearTimeout(timer);
      }
    }, [isExpanded]);

    /* Click outside to collapse if empty */
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          if (!inputValue) {
            setExpanded(false);
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputValue, setExpanded]);

    /* Imperative handle */
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setInputValue(''),
      expand: () => setExpanded(true),
      collapse: () => setExpanded(false),
      getValue: () => inputValue,
    }));

    return (
      <div ref={rootRef} className={`${styles.root} ${className}`}>
        <GooeyFilter filterId={filterId} blur={gooeyBlur} />

        <LayoutGroup id={safeId}>
          <div
            className={styles.gooeyFilterWrap}
            style={{ filter: `url(#${filterId})` }}
          >
            {/* ── Left Detached Bubble (Visible when expanded) ── */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  key="detached-bubble"
                  className={styles.bubbleMotion}
                  initial={{ scale: 0.2, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0.2, opacity: 0, x: 20 }}
                  transition={SPRING_CONFIG}
                  onClick={() => inputRef.current?.focus()}
                >
                  <div className={styles.bubbleSurface}>
                    <motion.div layoutId={iconLayoutId} className={styles.iconCenter}>
                      <Search size={18} strokeWidth={2.2} />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Main Pill Surface ── */}
            <motion.div
              layout
              className={styles.pillMotion}
              initial={false}
              animate={{
                width: isExpanded ? expandedWidth : collapsedWidth,
              }}
              transition={SPRING_CONFIG}
              onClick={handleExpand}
            >
              <div
                className={`${styles.pillSurface} ${
                  isExpanded ? styles.pillSurfaceExpanded : styles.pillSurfaceCollapsed
                }`}
              >
                {/* When collapsed, search icon lives inside the pill and transitions via layoutId */}
                {!isExpanded && (
                  <motion.div layoutId={iconLayoutId} className={styles.collapsedIconWrap}>
                    <Search size={16} strokeWidth={2.2} className={styles.searchIcon} />
                  </motion.div>
                )}

                {/* Text input field */}
                <div className={styles.inputContainer}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || !isExpanded}
                    className={styles.inputElement}
                    aria-label="Search"
                  />
                </div>

                {/* Right action button: Clear (X) or Submit (Arrow) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className={styles.rightActionWrap}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {inputValue ? (
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={handleClear}
                            aria-label="Clear input"
                            title="Clear"
                          >
                            <X size={14} strokeWidth={2.4} />
                          </button>
                          {showSubmitButton && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionSubmitBtn}`}
                              onClick={handleSubmit}
                              aria-label="Submit search"
                              title="Submit (Enter)"
                            >
                              <ArrowRight size={14} strokeWidth={2.4} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={handleCollapse}
                          aria-label="Close search"
                          title="Close (Esc)"
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </LayoutGroup>
      </div>
    );
  }
);

GooeyInput.displayName = 'GooeyInput';
