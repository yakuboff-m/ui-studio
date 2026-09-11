'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import styles from './FAQ.module.scss';

/* ─── Types ─── */
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  title: string;
  items: FAQItem[];
}

export interface FAQProps {
  sections?: FAQSection[];
  title?: string;
  subtitle?: string;
  contactEmail?: string;
  theme?: 'auto' | 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

/* ─── Blur-reveal animation — words cascade in like uncovering, not typing ─── */
// Stagger is short (28ms/word) so the full paragraph reveals in ~0.5s.
// Each word goes blur→sharp + transparent→opaque simultaneously.
// This matches Aceternity "Simple FAQs" reveal aesthetic.
const WordReveal: React.FC<{ text: string; animKey: number }> = ({ text, animKey }) => {
  const words = text.split(' ');
  const msPerWord = 28; // fast cascade, not slow typing

  return (
    <span key={animKey} className={styles.revealText}>
      {words.map((word, i) => (
        <span
          key={i}
          className={styles.revealWord}
          style={{ animationDelay: `${i * msPerWord}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  );
};

/* ─── Single FAQ Item ─── */
interface FAQAccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQAccordionItem: React.FC<FAQAccordionItemProps> = ({ item, isOpen, onToggle }) => {
  const [animKey, setAnimKey] = useState(0);
  const prevOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setAnimKey((k) => k + 1);
    }
    prevOpen.current = isOpen;
  }, [isOpen]);

  return (
    <div className={isOpen ? `${styles.item} ${styles.itemOpen}` : styles.item}>
      {isOpen && (
        <>
          {/* crossH: horizontal top + bottom lines, extend 36px past left/right edges */}
          <div className={styles.crossH} aria-hidden="true" />
          {/* crossV: vertical left + right lines, extend 12px past crossH on top/bottom */}
          <div className={styles.crossV} aria-hidden="true" />
        </>
      )}
      <button
        type="button"
        className={styles.itemTrigger}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.question}>{item.question}</span>
        <span className={styles.icon}>
          {isOpen ? <X size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.answerCard}>
              <p className={styles.answer}>
                <WordReveal text={item.answer} animKey={animKey} />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Default FAQ data ─── */
const DEFAULT_SECTIONS: FAQSection[] = [
  {
    title: 'Pricing',
    items: [
      {
        question: 'How much does it cost to deploy AI agents?',
        answer: 'Our pricing starts at $49/month for the Starter plan which includes up to 5 AI agents and 10,000 task executions. Scale plans start at $199/month for unlimited agents and 100,000 executions. Enterprise pricing is available for high-volume needs.',
      },
      {
        question: 'Is there a free trial available?',
        answer: 'Yes, we offer a 14-day free trial with no credit card required. You get access to all features including up to 3 AI agents and 1,000 task executions during the trial period.',
      },
      {
        question: 'What happens if I exceed my plan limits?',
        answer: 'If you exceed your plan limits, your agents will pause until the next billing cycle. You can upgrade your plan at any time or purchase add-on executions to continue without interruption.',
      },
      {
        question: 'Can I change plans at any time?',
        answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer a 30-day money-back guarantee on all plans. If you are not satisfied with your purchase, contact our support team within 30 days for a full refund.',
      },
    ],
  },
  {
    title: 'Agents',
    items: [
      {
        question: 'What can AI agents automate?',
        answer: 'AI agents can automate a wide range of tasks including data collection and processing, email and calendar management, customer support workflows, content generation, code review, and complex multi-step business processes.',
      },
      {
        question: 'How do I deploy and orchestrate my agents?',
        answer: 'You can deploy agents through our web dashboard, REST API, or CLI. Our orchestration engine handles scheduling, retries, error handling, and inter-agent communication automatically.',
      },
      {
        question: 'Can agents make autonomous decisions?',
        answer: 'Yes. Agents can be configured with decision trees and dynamic prompts that allow them to autonomously branch logic, call external APIs, and adapt their behavior based on real-time data without human intervention.',
      },
    ],
  },
  {
    title: 'Legal',
    items: [
      {
        question: 'How is my data protected?',
        answer: 'We use AES-256 encryption for data at rest and TLS 1.3 for data in transit. All data is stored in SOC 2 Type II certified data centers. We never sell your data and you maintain full ownership at all times.',
      },
      {
        question: 'Are you GDPR compliant?',
        answer: 'Yes, we are fully GDPR compliant. We provide data processing agreements, support right-to-erasure requests, and offer EU-region data residency options for all customers.',
      },
    ],
  },
];

/* ─── Main FAQ Component ─── */
export const FAQ: React.FC<FAQProps> = ({
  sections = DEFAULT_SECTIONS,
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about deploying AI agents and automating your workflows.',
  contactEmail,
  theme = 'auto',
  className = '',
  style,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));
  const dataThemeAttr = theme === 'auto' ? undefined : theme;

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-theme={dataThemeAttr}
      style={style}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>
          {subtitle}
          {contactEmail && (
            <>{' '}<a href={`mailto:${contactEmail}`} className={styles.email}>{contactEmail}</a></>
          )}
        </p>
      </div>

      <div className={styles.sections}>
        {sections.map((section, si) => (
          <div key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.sectionItems}>
              {section.items.map((item, ii) => {
                const id = `${si}-${ii}`;
                return (
                  <FAQAccordionItem
                    key={id}
                    item={item}
                    isOpen={openId === id}
                    onToggle={() => toggle(id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
