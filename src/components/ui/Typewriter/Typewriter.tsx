'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import styles from './Typewriter.module.scss';

export type TypewriterSpeed = 'chill' | 'slow' | 'normal' | 'fast' | number;
export type TypewriterVariance = 'natural' | 'none' | number;
export type TypewriterReplace = 'type' | 'all';
export type TypewriterBackspace = 'character' | 'word' | 'all';

export interface TypewriterChangePayload {
  text: string;
  character: string;
  isBackspace: boolean;
}

export interface TypewriterProps {
  /** Text or array of strings to type (cycles if array or loop is enabled) */
  text?: string | string[];
  /** Alias for text if passed as children */
  children?: string | string[];
  /** HTML tag or element to render as (e.g. 'h2', 'span', 'p') */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p' | 'div';
  /** Typing speed preset ('chill' | 'slow' | 'normal' | 'fast') or milliseconds per character */
  speed?: TypewriterSpeed;
  /** Cadence variance: 'natural' models human finger pauses, numbers add % jitter */
  variance?: TypewriterVariance;
  /** Whether to loop through array of texts or replay indefinitely */
  loop?: boolean;
  /** Pause duration (seconds) before backspacing or switching to next text */
  pauseDuration?: number;
  /** Replace mode: 'type' backspaces, 'all' clears immediately */
  replace?: TypewriterReplace;
  /** Backspace mode: 'character', 'word', or 'all' */
  backspace?: TypewriterBackspace;
  /** Factor applied to base speed during backspacing (default: 0.3 for faster deletion) */
  backspaceFactor?: number;
  /** Whether typing is active */
  play?: boolean;
  /** Cursor color accent: 'mint' | 'blue' | 'purple' | 'amber' | 'rose' */
  cursorColor?: 'mint' | 'blue' | 'purple' | 'amber' | 'rose';
  /** Custom cursor style override */
  cursorStyle?: React.CSSProperties;
  /** Custom cursor class name */
  cursorClassName?: string;
  /** Custom text style override */
  textStyle?: React.CSSProperties;
  /** Custom text class name */
  textClassName?: string;
  /** Theme: 'dark' | 'light' | 'auto' */
  theme?: 'dark' | 'light' | 'auto';
  /** Render inside styled preview card with replay control */
  showCard?: boolean;
  /** Show replay button in top-right of card */
  showReplay?: boolean;
  /** Callback fired when target text typing is fully completed */
  onComplete?: () => void;
  /** Callback fired on each character change */
  onChange?: (payload: TypewriterChangePayload) => void;
  className?: string;
  style?: React.CSSProperties;
}

const SPEED_PRESETS: Record<'chill' | 'slow' | 'normal' | 'fast', number> = {
  chill: 220,
  slow: 180,
  normal: 135,
  fast: 85,
};

const PUNCTUATION_SET = new Set(['.', ',', '!', '?', ':', ';', "'", '"', '-', '(', ')']);
const SYMBOLS_SET = new Set([
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?',
]);

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function needsBackspace(current: string, target: string) {
  return current.length > target.length || (current.length > 0 && !target.startsWith(current));
}

function findWordBoundary(str: string, pos: number) {
  let e = pos - 1;
  while (e >= 0 && /\s/.test(str[e])) e--;
  while (e >= 0 && !/\s/.test(str[e])) e--;
  return Math.max(0, e + 1);
}

function commonPrefixLength(a: string, b: string) {
  const len = Math.min(a.length, b.length);
  let o = 0;
  for (let i = 0; i < len && a[i] === b[i]; i++) {
    o = i + 1;
  }
  return o;
}

function getNextText(
  current: string,
  target: string,
  replace: TypewriterReplace = 'type',
  backspace: TypewriterBackspace = 'character'
) {
  if (replace === 'type' && needsBackspace(current, target)) {
    if (backspace === 'all') {
      return target.slice(0, commonPrefixLength(current, target));
    }
    if (backspace === 'word') {
      const idx = findWordBoundary(current, current.length);
      return current.slice(0, idx);
    }
    return current.slice(0, -1);
  }
  return target.slice(0, current.length + 1);
}

function getNaturalDelay(target: string, current: string, baseDelay: number) {
  const currentLen = current.length;
  const nextChar = target[currentLen];
  const prevChar = target[currentLen - 1];
  if (!nextChar) return baseDelay;

  const lastSpace = target.slice(0, currentLen).lastIndexOf(' ');
  const distFromWordStart = currentLen - lastSpace - 1;
  const wordStart = lastSpace + 1;
  const nextSpace = target.slice(currentLen).indexOf(' ');
  const wordLen = (nextSpace === -1 ? target.length : currentLen + nextSpace) - wordStart;

  let factor = 1;

  // Natural pause after punctuation marks
  if (prevChar && /[.!?]/.test(prevChar) && nextChar === ' ') {
    factor *= 2.2;
  } else if (prevChar && /[,;:]/.test(prevChar) && nextChar === ' ') {
    factor *= 1.6;
  }

  // Word onset vs middle cadence
  if (wordLen <= 3) {
    factor *= 0.85;
  } else {
    if (distFromWordStart === 0 && nextChar !== ' ') {
      factor *= 1.35;
    }
    if (distFromWordStart === wordLen - 1) {
      factor *= 1.2;
    }
  }

  // Slight acceleration across internal syllables, capped so letters don't rush
  if (distFromWordStart > 0 && distFromWordStart < wordLen - 1 && wordLen > 3) {
    const ramp = Math.min(distFromWordStart / wordLen, 0.25);
    factor *= 1 - ramp;
  }

  if (PUNCTUATION_SET.has(nextChar)) factor *= 1.35;
  if (SYMBOLS_SET.has(nextChar)) factor *= 1.35;
  if (/\d/.test(nextChar)) factor *= 1.2;
  if (nextChar !== nextChar.toLowerCase() && nextChar !== ' ') factor *= 1.25;

  // Gentle human micro-jitter (-15% to +15%)
  const jitter = mix(-0.15, 0.15, Math.random());
  factor *= 1 + jitter;

  const delay = baseDelay * factor;
  // Ensure keystrokes never fall below 55% of base speed
  return Math.max(Math.round(baseDelay * 0.55), Math.round(delay));
}

function getDelay(
  target: string,
  current: string,
  baseDelay: number,
  variance: TypewriterVariance = 'natural',
  backspaceFactor: number = 0.2
) {
  if (needsBackspace(current, target)) {
    return baseDelay * backspaceFactor;
  }
  if (variance === 'natural') {
    return getNaturalDelay(target, current, baseDelay);
  }
  if (typeof variance === 'number' && variance > 0) {
    const range = baseDelay * (variance / 100);
    return baseDelay + mix(-range, range, Math.random());
  }
  return baseDelay;
}

function ReplayIcon() {
  return (
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export const Typewriter = forwardRef<HTMLElement, TypewriterProps>(function Typewriter(
  {
    text,
    children,
    as: Component = 'h2',
    speed = 'normal',
    variance = 'natural',
    loop = false,
    pauseDuration = 1.6,
    replace = 'type',
    backspace = 'character',
    backspaceFactor = 0.2,
    play = true,
    cursorColor = 'mint',
    cursorStyle,
    cursorClassName,
    textStyle,
    textClassName,
    theme = 'dark',
    showCard = false,
    showReplay = false,
    onComplete,
    onChange,
    className,
    style,
    ...rest
  },
  ref
) {
  // Normalize text input (either string or array of strings)
  const rawInput = text !== undefined ? text : children !== undefined ? children : 'Hello world!';
  const textArray: string[] = Array.isArray(rawInput) ? rawInput : [String(rawInput)];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [replayCount, setReplayCount] = useState(0);

  const targetText = textArray[currentIndex] || '';
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const baseDelay = typeof speed === 'number' ? speed : SPEED_PRESETS[speed] || 75;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleReplay = useCallback(() => {
    clearTimer();
    setCurrentIndex(0);
    setDisplayedText('');
    setIsTyping(true);
    setReplayCount((c) => c + 1);
  }, [clearTimer]);

  useEffect(() => {
    if (!play) {
      clearTimer();
      setIsTyping(false);
      return;
    }

    const step = () => {
      setDisplayedText((curr) => {
        const next = getNextText(curr, targetText, replace, backspace);

        if (onChange) {
          const isBack = next.length < curr.length;
          const char = isBack ? curr.slice(next.length) : next.slice(curr.length);
          onChange({ text: next, character: char, isBackspace: isBack });
        }

        if (next === targetText) {
          // Completed typing current string
          setIsTyping(false);
          onComplete?.();

          // If multiple strings or loop is requested, queue next transition
          if (textArray.length > 1 || loop) {
            timeoutRef.current = setTimeout(() => {
              setIsTyping(true);
              setCurrentIndex((idx) => (idx + 1) % textArray.length);
            }, pauseDuration * 1000);
          }
        } else {
          setIsTyping(true);
          const nextDelay = getDelay(
            targetText,
            next,
            baseDelay,
            variance,
            backspaceFactor
          );
          timeoutRef.current = setTimeout(step, nextDelay);
        }

        return next;
      });
    };

    const initialDelay = getDelay(
      targetText,
      displayedText,
      baseDelay,
      variance,
      backspaceFactor
    );
    timeoutRef.current = setTimeout(step, initialDelay);

    return clearTimer;
  }, [
    play,
    targetText,
    baseDelay,
    variance,
    replace,
    backspace,
    backspaceFactor,
    loop,
    pauseDuration,
    textArray.length,
    replayCount,
    clearTimer,
    onComplete,
    onChange,
  ]);

  // Theme resolution
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

  const elementRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => elementRef.current as HTMLElement);

  const typewriterInner = (
    <Component
      ref={elementRef as any}
      className={`${styles.heading} ${className || ''}`}
      style={style}
      aria-label={targetText}
      {...rest}
    >
      <span className={`${styles.textSpan} ${textClassName || ''}`} style={textStyle}>
        {displayedText}
      </span>
      <span
        aria-hidden="true"
        className={`${styles.cursor} ${isTyping ? styles.typing : styles.blinking} ${
          cursorClassName || ''
        }`}
        style={cursorStyle}
      />
    </Component>
  );

  if (showCard) {
    return (
      <div
        className={styles.container}
        data-theme={activeTheme}
        data-color={cursorColor}
      >
        <div className={styles.statusBar}>
          <span className={styles.badgeTag}>{variance === 'natural' ? 'Natural Cadence' : 'Constant Speed'}</span>
          {showReplay && (
            <button
              type="button"
              className={styles.replayBtn}
              onClick={handleReplay}
              title="Replay typing animation"
              aria-label="Replay"
            >
              <ReplayIcon />
              <span>Replay</span>
            </button>
          )}
        </div>

        <div className={styles.typewriterWrapper}>
          {typewriterInner}
        </div>
      </div>
    );
  }

  return typewriterInner;
});
