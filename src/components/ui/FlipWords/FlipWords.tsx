'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './FlipWords.module.scss';

export interface FlipWordsProps {
  /** Array of words or phrases to cycle through */
  words: string[];
  /** Duration in milliseconds that each word remains visible before flipping */
  duration?: number;
  /** Custom theme override: 'auto' | 'dark' | 'light' */
  theme?: 'auto' | 'dark' | 'light';
  /** Additional CSS class names */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

export const FlipWords: React.FC<FlipWordsProps> = ({
  words,
  duration = 2500,
  theme = 'auto',
  className = '',
  style,
}) => {
  const [currentWord, setCurrentWord] = useState<string>(words[0] || '');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Cycle to next word safely
  const startAnimation = useCallback(() => {
    if (!words || words.length === 0) return;
    const currentIndex = words.indexOf(currentWord);
    const nextIndex = (currentIndex + 1) % words.length;
    const nextWord = words[nextIndex] ?? words[0];
    setCurrentWord(nextWord);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating && words.length > 1) {
      const timer = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, startAnimation, words.length]);

  // Sync if words array changes externally
  useEffect(() => {
    if (words && words.length > 0 && !words.includes(currentWord)) {
      setCurrentWord(words[0]);
    }
  }, [words, currentWord]);

  const dataThemeAttr = theme === 'auto' ? undefined : theme;

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.span
        key={currentWord}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 12,
        }}
        exit={{
          opacity: 0,
          y: -24,
          x: 20,
          filter: 'blur(6px)',
          scale: 1.1,
          position: 'absolute',
          transition: {
            duration: 0.28,
            ease: 'easeInOut',
          },
        }}
        className={`${styles.flipWords} ${className}`}
        data-theme={dataThemeAttr}
        style={style}
      >
        {currentWord.split(' ').map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: wordIndex * 0.15,
              duration: 0.25,
            }}
            className={styles.wordSpan}
          >
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: wordIndex * 0.15 + letterIndex * 0.035,
                  duration: 0.2,
                }}
                className={styles.letterSpan}
              >
                {letter}
              </motion.span>
            ))}
            <span className={styles.spaceSpan}>&nbsp;</span>
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  );
};
