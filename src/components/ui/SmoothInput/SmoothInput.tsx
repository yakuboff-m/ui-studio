'use client';

import React, {
  type ComponentPropsWithRef,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import styles from './SmoothInput.module.scss';

const PASSWORD_CHAR = typeof navigator !== 'undefined' && navigator.userAgent.match(/firefox|fxios/i)
  ? '\u25CF'
  : '\u2022';

export type SmoothInputProps = ComponentPropsWithRef<'input'> & {
  wrapperClassName?: string;
  isDockMode?: boolean;
};

export const SmoothInput = forwardRef<HTMLInputElement, SmoothInputProps>(({
  className = '',
  wrapperClassName = '',
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  type = 'text',
  placeholder,
  style,
  isDockMode = false,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const caretX = useMotionValue(0);
  const caretOpacity = useMotionValue(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const innerInputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Expose inner input ref to parent
  useImperativeHandle(ref, () => innerInputRef.current as HTMLInputElement);

  const isControlled = value !== undefined;
  const inputValue = isControlled ? String(value) : internalValue;

  const springCaretX = useSpring(
    caretX,
    prefersReducedMotion
      ? { stiffness: 10000, damping: 100, mass: 0.1 }
      : { stiffness: 500, damping: 30, mass: 0.5 }
  );

  const syncMeasureSpan = () => {
    const input = innerInputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return;

    const computedStyle = window.getComputedStyle(input);
    const isPassword = type === 'password';

    let fontSize = computedStyle.fontSize;
    if (
      PASSWORD_CHAR === '\u2022' &&
      isPassword &&
      typeof navigator !== 'undefined' &&
      !navigator.userAgent.match(/chrome|chromium|crios/i)
    ) {
      fontSize = `${parseFloat(fontSize) + 6.25}px`;
    }

    measureSpan.style.font = `${computedStyle.fontStyle} ${computedStyle.fontWeight} ${fontSize} ${computedStyle.fontFamily}`;
    measureSpan.style.letterSpacing = computedStyle.letterSpacing;
    measureSpan.style.fontFeatureSettings = computedStyle.fontFeatureSettings;
    measureSpan.style.fontVariationSettings = computedStyle.fontVariationSettings;
  };

  const measurePrefixWidth = (text: string) => {
    const input = innerInputRef.current;
    const measureSpan = measureRef.current;
    if (!input || !measureSpan) return null;

    syncMeasureSpan();
    measureSpan.textContent = text;

    const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft) || 0;

    return text.length > 0
      ? measureSpan.offsetWidth + paddingLeft
      : paddingLeft - 1;
  };

  const scrollCaretIntoView = (target: HTMLInputElement, absoluteWidth: number) => {
    const computedStyle = window.getComputedStyle(target);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
    const visibleLeft = target.scrollLeft + paddingLeft;

    if (absoluteWidth > visibleRight) {
      target.scrollLeft = Math.min(
        absoluteWidth - target.clientWidth + paddingRight,
        maxScroll
      );
      return;
    }

    if (absoluteWidth < visibleLeft) {
      target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
    }
  };

  const getCaretIndex = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;

    if (selectionStart === selectionEnd) {
      return selectionStart;
    }

    return target.selectionDirection === 'backward'
      ? selectionStart
      : selectionEnd;
  };

  const updateCaretFromInput = (target: HTMLInputElement) => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex = getCaretIndex(target);
    const isPassword = type === 'password';
    const textBeforeCaret = isPassword
      ? PASSWORD_CHAR.repeat(caretIndex)
      : target.value.slice(0, caretIndex);

    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;

    scrollCaretIntoView(target, absoluteWidth);

    const computedStyle = window.getComputedStyle(target);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;

    caretX.set(Math.min(caretPosition, maxX));

    if (!isCaretVisible || hasSelection) {
      caretOpacity.set(0);
      return;
    }

    caretOpacity.set(1);
  };

  const updateCaretRef = useRef(updateCaretFromInput);
  updateCaretRef.current = updateCaretFromInput;
  const caretOpacityRef = useRef(caretOpacity);
  caretOpacityRef.current = caretOpacity;

  useEffect(() => {
    const input = innerInputRef.current;
    if (input && document.activeElement === input) {
      updateCaretRef.current(input);
    }
  }, [inputValue, type]);

  useEffect(() => {
    const input = innerInputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    const updateCaretIfFocused = () => {
      if (document.activeElement === input) {
        updateCaretRef.current(input);
      }
    };

    const handleSelectionChange = () => {
      if (document.activeElement !== input) return;

      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          updateCaretRef.current(input);
        }
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', updateCaretIfFocused);
      void document.fonts.ready.then(updateCaretIfFocused);
    }
    input.addEventListener('scroll', updateCaretIfFocused);

    const resizeObserver = new ResizeObserver(updateCaretIfFocused);
    resizeObserver.observe(container);

    updateCaretIfFocused();

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (document.fonts) {
        document.fonts.removeEventListener('loadingdone', updateCaretIfFocused);
      }
      input.removeEventListener('scroll', updateCaretIfFocused);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`${isDockMode ? styles.dockWrapper : styles.inputWrapper} ${wrapperClassName}`}>
      <div
        ref={containerRef}
        className={styles.containerGrid}
      >
        <input
          {...props}
          ref={innerInputRef}
          type={type}
          placeholder={placeholder}
          className={`${styles.inputField} ${className}`}
          style={style}
          value={inputValue}
          onChange={(e) => {
            if (!isControlled) setInternalValue(e.target.value);
            onChange?.(e);
            requestAnimationFrame(() => {
              updateCaretRef.current(e.target);
            });
          }}
          onFocus={(e) => {
            caretOpacityRef.current.set(1);
            requestAnimationFrame(() => {
              updateCaretRef.current(e.target);
            });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            caretOpacityRef.current.set(0);
            onBlur?.(e);
          }}
        />
        <span
          ref={measureRef}
          aria-hidden
          className={styles.measureSpan}
        />
        <motion.div
          className={styles.smoothCaret}
          style={{ x: springCaretX, opacity: caretOpacity }}
        />
      </div>
    </div>
  );
});

SmoothInput.displayName = 'SmoothInput';
