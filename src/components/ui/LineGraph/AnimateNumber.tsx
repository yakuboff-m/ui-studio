'use client';

import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import {
  animate,
  AnimatePresence,
  motion,
  MotionConfig,
  MotionConfigContext,
  useIsPresent,
  usePresence,
  HTMLMotionProps,
} from 'framer-motion';

const MASK_HEIGHT = 'var(--mask-height, 0.15em)';
const MASK_WIDTH = 'var(--mask-width, 0.5em)';
const RADIAL_COLOR = '#000 0, transparent 71%';

const MASK_IMAGE = `linear-gradient(to right, transparent 0, #000 ${MASK_WIDTH}, #000 calc(100% - ${MASK_WIDTH}), transparent),linear-gradient(to bottom, transparent 0, #000 ${MASK_HEIGHT}, #000 calc(100% - ${MASK_HEIGHT}), transparent 100%),radial-gradient(at bottom right, ${RADIAL_COLOR}),radial-gradient(at bottom left, ${RADIAL_COLOR}),radial-gradient(at top left, ${RADIAL_COLOR}),radial-gradient(at top right, ${RADIAL_COLOR})`;

const MASK_SIZE = `100% calc(100% - ${MASK_HEIGHT} * 2),calc(100% - ${MASK_WIDTH} * 2) 100%,${MASK_WIDTH} ${MASK_HEIGHT},${MASK_WIDTH} ${MASK_HEIGHT},${MASK_WIDTH} ${MASK_HEIGHT},${MASK_WIDTH} ${MASK_HEIGHT}`;

const widthCache = new WeakMap<Element, string>();

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function useIsFirstRender(): boolean {
  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = false;
  }, []);
  return isFirst.current;
}

function getEmWidth(el: HTMLElement): string {
  if (typeof window === 'undefined') return '0em';
  const { width, fontSize } = window.getComputedStyle(el);
  const w = parseFloat(width);
  const fs = parseFloat(fontSize) || 16;
  return `${w / fs}em`;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function MaskContainer({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        margin: `0 calc(-1 * ${MASK_WIDTH})`,
        padding: `calc(${MASK_HEIGHT} / 2) ${MASK_WIDTH}`,
        position: 'relative',
        zIndex: -1,
        overflow: 'clip',
        WebkitMaskImage: MASK_IMAGE,
        WebkitMaskSize: MASK_SIZE,
        WebkitMaskPosition: 'center, center, top left, top right, bottom right, bottom left',
        WebkitMaskRepeat: 'no-repeat',
        maskImage: MASK_IMAGE,
        maskSize: MASK_SIZE,
        maskPosition: 'center, center, top left, top right, bottom right, bottom left',
        maskRepeat: 'no-repeat',
      }}
    >
      {children}
    </span>
  );
}

interface DigitReelProps {
  value: number;
  initialValue?: number;
  trend?: number;
  initial?: any;
  animate?: any;
  exit?: any;
}

const DigitReel = forwardRef<HTMLSpanElement, DigitReelProps>(function DigitReel(
  props: DigitReelProps,
  ref
) {
  const { value, initialValue = value, trend = 0, ...rest } = props;
  const motionConfig = useContext(MotionConfigContext);
  const transition = motionConfig?.transition || { type: 'spring', duration: 0.6, bounce: 0.2 };

  const initialDigit = useRef(initialValue).current;
  const isFirst = useIsFirstRender();
  const innerRef = useRef<HTMLSpanElement>(null);
  const outerRef = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => outerRef.current!, []);

  const digitRefs = useRef<(HTMLSpanElement | null)[]>(new Array(10));
  const isPresent = useIsPresent();
  const activeDigit: number = isPresent ? value : 0;

  useIsomorphicLayoutEffect(() => {
    if (!innerRef.current || !digitRefs.current[initialDigit]) return;
    innerRef.current.style.width = getEmWidth(digitRefs.current[initialDigit]!);
  }, []);

  const prevDigitRef = useRef<number>(initialValue);
  useIsomorphicLayoutEffect(() => {
    if (!innerRef.current || activeDigit === prevDigitRef.current) return;
    const innerRect = innerRef.current.getBoundingClientRect();
    const outerRect = outerRef.current?.getBoundingClientRect();
    const prev = prevDigitRef.current;

    let step = activeDigit - prev;
    if (trend > 0 && activeDigit < prev) {
      step = 10 - prev + activeDigit;
    } else if (trend < 0 && activeDigit > prev) {
      step = activeDigit - 10 - prev;
    }

    const startY =
      innerRect.height * step + (innerRect.top - (outerRect ? outerRect.top || 0 : innerRect.top));

    animate(innerRef.current, { y: [startY, 0] }, transition as any);
    return () => {
      prevDigitRef.current = activeDigit;
    };
  }, [activeDigit]);

  useEffect(() => {
    if ((isFirst && initialDigit === activeDigit) || !digitRefs.current[activeDigit]) return;
    const width = getEmWidth(digitRefs.current[activeDigit]!);
    if (outerRef.current) {
      widthCache.set(outerRef.current, width);
      animate(outerRef.current, { width }, transition as any);
    }
  }, [activeDigit]);

  const renderDigit = (d: number) => (
    <span
      key={d}
      ref={(el) => {
        digitRefs.current[d] = el;
      }}
      style={{ display: 'inline-block', padding: `calc(${MASK_HEIGHT} / 2) 0` }}
    >
      {d}
    </span>
  );

  const above: number[] = [];
  const below: number[] = [];
  for (let i = 9; i >= 1; i--) above.push(mod(activeDigit - i, 10));
  for (let i = 1; i <= 9; i++) below.push(mod(activeDigit + i, 10));

  return (
    <motion.span
      {...rest}
      ref={outerRef}
      data-state={isPresent ? undefined : 'exiting'}
      style={{ display: 'inline-flex', justifyContent: 'center' }}
    >
      <span
        ref={innerRef}
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {above.length > 0 && (
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'absolute',
              width: '100%',
              bottom: '100%',
              left: 0,
            }}
          >
            {above.map(renderDigit)}
          </span>
        )}
        {renderDigit(activeDigit)}
        {below.length > 0 && (
          <span
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'absolute',
              width: '100%',
              top: '100%',
              left: 0,
            }}
          >
            {below.map(renderDigit)}
          </span>
        )}
      </span>
    </motion.span>
  );
});

const JustifyContext = React.createContext<{ justify: 'left' | 'right' }>({ justify: 'left' });

interface StaticPartProps {
  partKey: string;
  type: string;
  children: React.ReactNode;
  initial?: any;
  animate?: any;
  exit?: any;
}

const StaticPart = forwardRef<HTMLSpanElement, StaticPartProps>(function StaticPart(
  props: StaticPartProps,
  ref
) {
  const { partKey, type, children, ...rest } = props;
  const isPresent = useIsPresent();
  const { justify } = useContext(JustifyContext);

  return (
    <motion.span
      {...rest}
      ref={ref}
      data-state={isPresent ? undefined : 'exiting'}
      style={{
        display: 'inline-flex',
        justifyContent: justify,
        padding: `calc(${MASK_HEIGHT} / 2) 0`,
        position: 'relative',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(children)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

interface PartData {
  type: string;
  value: any;
  key: string;
}

interface NumberSectionProps {
  parts: PartData[];
  justify?: 'left' | 'right';
  mode?: 'wait' | 'popLayout' | 'sync';
  style?: React.CSSProperties;
  name: string;
  trend?: number;
  'aria-hidden'?: boolean;
}

const NumberSection = forwardRef<HTMLSpanElement, NumberSectionProps>(function NumberSection(
  props: NumberSectionProps,
  ref
) {
  const { parts, justify = 'left', mode, style = {}, name, trend, ...rest } = props;
  const containerRef = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => containerRef.current!, []);
  const contextValue = useMemo(() => ({ justify }), [justify]);
  const innerRef = useRef<HTMLSpanElement>(null);
  const isFirst = useIsFirstRender();
  const motionConfig = useContext(MotionConfigContext);
  const transition = motionConfig?.transition || { type: 'spring', duration: 0.6, bounce: 0.2 };

  useEffect(() => {
    if (!innerRef.current || !containerRef.current) return;
    if (isFirst) {
      containerRef.current.style.width = getEmWidth(innerRef.current);
      return;
    }

    const children = Array.from(innerRef.current.children) as HTMLElement[];
    const restores: (() => void)[] = [];
    for (const child of children) {
      if (child.dataset.state === 'exiting') {
        const next = child.nextSibling;
        child.remove();
        restores.push(() => {
          innerRef.current?.insertBefore(child, next);
        });
      } else {
        const targetWidth = widthCache.get(child);
        if (targetWidth) {
          const prevWidth = child.style.width;
          child.style.width = targetWidth;
          restores.push(() => {
            child.style.width = prevWidth;
          });
        }
      }
    }
    const finalWidth = getEmWidth(innerRef.current);
    for (let i = restores.length - 1; i >= 0; i--) {
      restores[i]();
    }
    animate(containerRef.current, { width: finalWidth }, transition as any);
  }, [parts.map((p) => p.value).join(''), isFirst, transition]);

  return (
    <JustifyContext.Provider value={contextValue}>
      <span
        {...rest}
        ref={containerRef}
        className={`number-section-${name}`}
        style={{ ...style, display: 'inline-flex', justifyContent: justify }}
      >
        <span ref={innerRef} style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
          &#8203;
          <AnimatePresence mode={mode} initial={false}>
            {parts.map((part) =>
              part.type === 'integer' || part.type === 'fraction' ? (
                <DigitReel
                  key={part.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  value={Number(part.value)}
                  initialValue={isFirst ? undefined : 0}
                  trend={trend}
                />
              ) : (
                <StaticPart
                  key={part.type === 'literal' ? `${part.key}:${part.value}` : part.key}
                  type={part.type}
                  partKey={part.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {part.value}
                </StaticPart>
              )
            )}
          </AnimatePresence>
        </span>
      </span>
    </JustifyContext.Provider>
  );
});

function parseNumberToParts(
  value: number | string,
  options: { locales?: string; format?: Intl.NumberFormatOptions },
  prefix?: string,
  suffix?: string
) {
  const num = Number(value);
  const rawParts = new Intl.NumberFormat(options.locales, options.format).formatToParts(num);
  const parts: { type: string; value: string }[] = rawParts.map((p) => ({
    type: p.type,
    value: p.value,
  }));
  if (prefix) parts.unshift({ type: 'prefix', value: prefix });
  if (suffix) parts.push({ type: 'suffix', value: suffix });

  const pre: PartData[] = [];
  const integer: PartData[] = [];
  const fraction: PartData[] = [];
  const post: PartData[] = [];
  const counts: Record<string, number> = {};

  const getKey = (t: string) => `${t}:${(counts[t] = (counts[t] ?? -1) + 1)}`;

  let formatted = '';
  let hasInteger = false;
  let hasDecimal = false;

  for (const part of parts) {
    formatted += part.value;
    const type = part.type === 'minusSign' || part.type === 'plusSign' ? 'sign' : part.type;
    switch (type) {
      case 'integer':
        hasInteger = true;
        integer.push(
          ...part.value.split('').map((c) => ({
            type,
            value: parseInt(c, 10),
            key: '',
          }))
        );
        break;
      case 'group':
        integer.push({ type, value: part.value, key: getKey(type) });
        break;
      case 'decimal':
        hasDecimal = true;
        fraction.push({ type, value: part.value, key: getKey(type) });
        break;
      case 'fraction':
        fraction.push(
          ...part.value.split('').map((c) => ({
            type,
            value: parseInt(c, 10),
            key: getKey(type),
          }))
        );
        break;
      default:
        (hasInteger || hasDecimal ? post : pre).push({
          type,
          value: part.value,
          key: getKey(type),
        });
    }
  }

  const formattedInteger: PartData[] = [];
  for (let i = integer.length - 1; i >= 0; i--) {
    formattedInteger.unshift({
      ...integer[i],
      key: getKey(integer[i].type),
    });
  }

  return { pre, integer: formattedInteger, fraction, post, formatted };
}

export interface AnimateNumberProps extends HTMLMotionProps<'span'> {
  children: number | string;
  locales?: string;
  format?: Intl.NumberFormatOptions;
  transition?: any;
  suffix?: string;
  prefix?: string;
  trend?: number | ((prev: number, curr: number) => number);
}

export const AnimateNumber = forwardRef<HTMLSpanElement, AnimateNumberProps>(function AnimateNumber(
  props: AnimateNumberProps,
  ref
) {
  const { children, locales, format, transition, style, suffix, prefix, trend, ...rest } = props;

  const parts = useMemo(
    () => parseNumberToParts(children, { locales, format }, prefix, suffix),
    [children, locales, format, prefix, suffix]
  );
  const { pre, integer, fraction, post, formatted } = parts;

  const numValue = typeof children === 'string' ? parseFloat(children) : Number(children);
  const prevValueRef = useRef(numValue);
  const prevValue = prevValueRef.current;
  prevValueRef.current = numValue;

  let computedTrend: number;
  if (typeof trend === 'function') {
    computedTrend = trend(prevValue, numValue);
  } else if (trend !== undefined) {
    computedTrend = trend;
  } else {
    computedTrend = Math.sign(numValue - prevValue);
  }

  const motionConfig = useContext(MotionConfigContext);
  const effectiveTransition = transition ?? motionConfig?.transition ?? {
    type: 'spring',
    duration: 0.6,
    bounce: 0.2,
  };

  return (
    <MotionConfig transition={effectiveTransition}>
      <motion.span
        {...rest}
        ref={ref}
        style={{
          lineHeight: 1,
          ...style,
          display: 'inline-flex',
          isolation: 'isolate',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-label={formatted}
          style={{
            display: 'inline-flex',
            direction: 'ltr',
            isolation: 'isolate',
            position: 'relative',
            zIndex: -1,
          }}
        >
          <NumberSection
            style={{ padding: `calc(${MASK_HEIGHT} / 2) 0` }}
            aria-hidden={true}
            justify="right"
            mode="popLayout"
            parts={pre}
            name="pre"
            trend={computedTrend}
          />
          <MaskContainer>
            <NumberSection justify="right" parts={integer} name="integer" trend={computedTrend} />
            <NumberSection parts={fraction} name="fraction" trend={computedTrend} />
          </MaskContainer>
          <NumberSection
            style={{ padding: `calc(${MASK_HEIGHT} / 2) 0` }}
            aria-hidden={true}
            mode="popLayout"
            parts={post}
            name="post"
            trend={computedTrend}
          />
        </span>
      </motion.span>
    </MotionConfig>
  );
});

export default AnimateNumber;
