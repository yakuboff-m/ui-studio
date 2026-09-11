'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CopyButton.module.scss';

/* ── Types ── */
export interface CopyButtonProps {
  /** Text to copy to clipboard */
  value?: string;
  /** Label shown before copying */
  label?: string;
  /** Label shown after copying */
  copiedLabel?: string;
  /** Duration (ms) to show the "copied" state before resetting */
  resetDelay?: number;
  /** Called when copy succeeds */
  onCopy?: (value: string) => void;
  /** Theme */
  theme?: 'auto' | 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

/* ── Clipboard icon — Lucide "clipboard" (exact from motion.dev bundle) ── */
function ClipboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Lucide clipboard: rect body + top tab path */}
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

/* ── Checkmark icon — Lucide "check" (exact from motion.dev bundle) ── */
function CheckmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] as const }}
      />
    </svg>
  );
}

/* ── Shared animation variants ── */
const variants = {
  initial: { opacity: 0, filter: 'blur(6px)', y: 6 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    filter: 'blur(6px)',
    y: -6,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

/* ── Component ── */
export function CopyButton({
  value = 'Hello, world!',
  label = 'Copy',
  copiedLabel = 'Copied!',
  resetDelay = 2200,
  onCopy,
  theme = 'auto',
  className,
  style,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async () => {
    if (copied) return;
    try { await navigator.clipboard.writeText(value); } catch { /* sandbox */ }
    onCopy?.(value);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), resetDelay);
  }, [copied, value, onCopy, resetDelay]);

  return (
    <motion.button
      type="button"
      id="copy-button"
      className={[styles.btn, className].filter(Boolean).join(' ')}
      data-theme={theme === 'auto' ? undefined : theme}
      data-copied={copied || undefined}
      style={style}
      onClick={handleClick}
      layout
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        layout: { type: 'spring', bounce: 0.22, duration: 0.38 },
        scale: { duration: 0.12 },
      }}
      aria-label={copied ? copiedLabel : label}
      aria-pressed={copied}
    >
      {/*
       * mode="popLayout":
       *   - exiting span → immediately removed from layout flow (made absolute by FM)
       *   - entering span → in normal flow, drives button width
       * This means button always sizes to the *entering* content with no empty gap.
       * The button's `layout` prop smoothly animates the width change.
       */}
      <AnimatePresence mode="popLayout" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            className={styles.inner}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CheckmarkIcon />
            <span>{copiedLabel}</span>
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            className={styles.inner}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ClipboardIcon />
            <span>{label}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
