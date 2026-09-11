'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './UserButton.module.scss';

export interface UserProfile {
  fullName?: string;
  email?: string;
  initials?: string;
}

export interface UserButtonProps {
  /** User profile data */
  user?: UserProfile;
  /** Theme: 'dark' | 'light' | 'auto' (Dark by default) */
  theme?: 'dark' | 'light' | 'auto';
  /** Called when user clicks "Sign out" */
  onSignOut?: () => void;
  /** Called when user clicks "Manage account" */
  onManageAccount?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_USER: Required<UserProfile> = {
  fullName: 'Ada Lovelace',
  email: 'ada@motion.dev',
  initials: 'AL',
};

const SPRING = {
  type: 'spring' as const,
  bounce: 0.15,
  visualDuration: 0.25,
};

const contentAnimations = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)', transition: { delay: 0.15 } },
  exit: { opacity: 0, filter: 'blur(8px)' },
};

/* ── Exact Clerk SVG Credit (from motion.dev bundle) ── */
function SecuredByClerk() {
  return (
    <a
      href="https://clerk.com"
      target="_blank"
      rel="noreferrer"
      className={styles.clerkCredit}
      title="Secured by Clerk"
    >
      <span>Secured by</span>
      <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 14" aria-label="Clerk">
        <ellipse cx="7.889" cy="7" rx="2.187" ry="2.188" fill="currentColor" />
        <path
          d="M11.83 12.18a.415.415 0 0 1-.05.64A6.967 6.967 0 0 1 7.888 14a6.967 6.967 0 0 1-3.891-1.18.415.415 0 0 1-.051-.64l1.598-1.6a.473.473 0 0 1 .55-.074 3.92 3.92 0 0 0 1.794.431 3.92 3.92 0 0 0 1.792-.43.473.473 0 0 1 .551.074l1.599 1.598Z"
          fill="currentColor"
        />
        <path
          opacity="0.5"
          d="M11.78 1.18a.415.415 0 0 1 .05.64l-1.598 1.6a.473.473 0 0 1-.55.073 3.937 3.937 0 0 0-5.3 5.3.473.473 0 0 1-.074.55L2.71 10.942a.415.415 0 0 1-.641-.051 7 7 0 0 1 9.71-9.71Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.748 1.422c0-.06.05-.11.11-.11h1.64c.06 0 .11.05.11.11v11.156a.11.11 0 0 1-.11.11h-1.64a.11.11 0 0 1-.11-.11V1.422Zm-2.315 8.9a.112.112 0 0 0-.15.004 2.88 2.88 0 0 1-.884.569c-.36.148-.747.222-1.137.219-.33.01-.658-.047-.965-.166a2.422 2.422 0 0 1-.817-.527c-.424-.432-.668-1.05-.668-1.785 0-1.473.98-2.48 2.45-2.48.394-.005.785.074 1.144.234.325.144.617.35.86.607.04.044.11.049.155.01l1.108-.959a.107.107 0 0 0 .01-.152c-.832-.93-2.138-1.412-3.379-1.412-2.499 0-4.27 1.686-4.27 4.166 0 1.227.44 2.26 1.182 2.99.743.728 1.801 1.157 3.022 1.157 1.53 0 2.763-.587 3.485-1.34a.107.107 0 0 0-.009-.155l-1.137-.98Zm13.212-1.14a.108.108 0 0 1-.107.096H28.79a.106.106 0 0 0-.104.132c.286 1.06 1.138 1.701 2.302 1.701a2.59 2.59 0 0 0 1.136-.236 2.55 2.55 0 0 0 .862-.645.08.08 0 0 1 .112-.01l1.155 1.006c.044.039.05.105.013.15-.698.823-1.828 1.42-3.38 1.42-2.386 0-4.185-1.651-4.185-4.162 0-1.232.424-2.264 1.13-2.994.373-.375.82-.67 1.314-.87a3.968 3.968 0 0 1 1.557-.285c2.419 0 3.983 1.701 3.983 4.05a6.737 6.737 0 0 1-.04.647Zm-5.924-1.524a.104.104 0 0 0 .103.133h3.821c.07 0 .123-.066.103-.134-.26-.901-.921-1.503-1.947-1.503a2.13 2.13 0 0 0-.88.16 2.1 2.1 0 0 0-.733.507 2.242 2.242 0 0 0-.467.837Zm11.651-3.172c.061-.001.11.048.11.109v1.837a.11.11 0 0 1-.117.109 7.17 7.17 0 0 0-.455-.024c-1.43 0-2.27 1.007-2.27 2.329v3.732a.11.11 0 0 1-.11.11h-1.64a.11.11 0 0 1-.11-.11v-7.87c0-.06.049-.109.11-.109h1.64c.06 0 .11.05.11.11v1.104a.011.011 0 0 0 .02.007c.64-.857 1.587-1.333 2.587-1.333l.125-.001Zm4.444 4.81a.035.035 0 0 1 .056.006l2.075 3.334a.11.11 0 0 0 .093.052h1.865a.11.11 0 0 0 .093-.168L46.152 7.93a.11.11 0 0 1 .012-.131l2.742-3.026a.11.11 0 0 0-.081-.183h-1.946a.11.11 0 0 0-.08.036l-3.173 3.458a.11.11 0 0 1-.19-.074V1.422a.11.11 0 0 0-.11-.11h-1.64a.11.11 0 0 0-.11.11v11.156c0 .06.05.11.11.11h1.64a.11.11 0 0 0 .11-.11v-1.755a.11.11 0 0 1 .03-.075l1.35-1.452Z"
          fill="currentColor"
        />
      </svg>
    </a>
  );
}

/* ── Exact Manage Account Icon ── */
function GearIcon() {
  return (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.559 2.536A.667.667 0 0 1 7.212 2h1.574a.667.667 0 0 1 .653.536l.22 1.101c.466.178.9.429 1.287.744l1.065-.36a.667.667 0 0 1 .79.298l.787 1.362a.666.666 0 0 1-.136.834l-.845.742c.079.492.079.994 0 1.486l.845.742a.666.666 0 0 1 .137.833l-.787 1.363a.667.667 0 0 1-.791.298l-1.065-.36c-.386.315-.82.566-1.286.744l-.22 1.101a.666.666 0 0 1-.654.536H7.212a.666.666 0 0 1-.653-.536l-.22-1.101a4.664 4.664 0 0 1-1.287-.744l-1.065.36a.666.666 0 0 1-.79-.298L2.41 10.32a.667.667 0 0 1 .136-.834l.845-.743a4.7 4.7 0 0 1 0-1.485l-.845-.742a.666.666 0 0 1-.137-.833l.787-1.363a.667.667 0 0 1 .791-.298l1.065.36c.387-.315.821-.566 1.287-.744l.22-1.101ZM7.999 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      />
    </svg>
  );
}

/* ── Exact Sign Out Icon ── */
function SignOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.6 2.604A2.045 2.045 0 0 1 4.052 2h3.417c.544 0 1.066.217 1.45.604.385.387.601.911.601 1.458v.69c0 .413-.334.75-.746.75a.748.748 0 0 1-.745-.75v-.69a.564.564 0 0 0-.56-.562H4.051a.558.558 0 0 0-.56.563v7.875a.564.564 0 0 0 .56.562h3.417a.558.558 0 0 0 .56-.563v-.671c0-.415.333-.75.745-.75s.746.335.746.75v.671c0 .548-.216 1.072-.6 1.459a2.045 2.045 0 0 1-1.45.604H4.05a2.045 2.045 0 0 1-1.45-.604A2.068 2.068 0 0 1 2 11.937V4.064c0-.548.216-1.072.6-1.459Zm8.386 3.116a.743.743 0 0 1 1.055 0l1.74 1.75a.753.753 0 0 1 0 1.06l-1.74 1.75a.743.743 0 0 1-1.055 0 .753.753 0 0 1 0-1.06l.467-.47H5.858A.748.748 0 0 1 5.112 8c0-.414.334-.75.746-.75h5.595l-.467-.47a.753.753 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function Avatar({ initials, large = false }: { initials: string; large?: boolean }) {
  return (
    <motion.div
      layoutId="clerk-avatar"
      transition={SPRING}
      className={large ? styles.avatarLarge : styles.avatar}
    >
      {initials}
    </motion.div>
  );
}

function MenuContent({
  user,
  onManage,
  onSignOut,
}: {
  user: Required<UserProfile>;
  onManage: () => void;
  onSignOut: () => void;
}) {
  return (
    <motion.div
      layoutId="clerk-userbtn"
      className={styles.open}
      style={{ borderRadius: 16 }}
      transition={SPRING}
    >
      <div className={styles.menuHeader}>
        <div style={{ alignSelf: 'center' }}>
          <Avatar initials={user.initials} large />
        </div>
        <motion.div
          className={styles.menuHeaderContent}
          initial={contentAnimations.initial}
          animate={contentAnimations.animate}
          exit={contentAnimations.exit}
        >
          <p>{user.fullName}</p>
          <p>{user.email}</p>
        </motion.div>
      </div>

      <motion.div
        className={styles.menuContent}
        initial={contentAnimations.initial}
        animate={contentAnimations.animate}
        exit={contentAnimations.exit}
      >
        <div
          className={styles.menuItem}
          onClick={onManage}
          role="button"
          tabIndex={0}
        >
          <GearIcon />
          <span>Manage account</span>
        </div>

        <div
          className={styles.menuItem}
          onClick={onSignOut}
          role="button"
          tabIndex={0}
        >
          <SignOutIcon />
          <span>Sign out</span>
        </div>

        <div style={{ marginTop: 4 }}>
          <SecuredByClerk />
        </div>
      </motion.div>
    </motion.div>
  );
}

export const UserButton: React.FC<UserButtonProps> = ({
  user: userProp,
  theme = 'dark',
  onSignOut,
  onManageAccount,
  className,
  style,
}) => {
  const mergedUser: Required<UserProfile> = {
    fullName: userProp?.fullName || DEFAULT_USER.fullName,
    email: userProp?.email || DEFAULT_USER.email,
    initials:
      userProp?.initials ||
      (userProp?.fullName
        ? userProp.fullName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : DEFAULT_USER.initials),
  };

  const [signedIn, setSignedIn] = useState(true);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Resolved theme
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    setSignedIn(false);
    onSignOut?.();
  };

  const handleManage = () => {
    setOpen(false);
    onManageAccount?.();
  };

  return (
    <div
      className={`${styles.wrapper} ${className || ''}`}
      data-theme={activeTheme}
      style={style}
      ref={rootRef}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {signedIn ? (
          <div className={styles.root} key="user-button-root">
            <AnimatePresence>
              {!open ? (
                <motion.button
                  key="closed"
                  layoutId="clerk-userbtn"
                  className={styles.closed}
                  style={{ borderRadius: 99 }}
                  transition={SPRING}
                  onClick={() => setOpen(true)}
                  aria-label="Open account menu"
                  type="button"
                >
                  <Avatar initials={mergedUser.initials} />
                </motion.button>
              ) : (
                <MenuContent
                  key="open"
                  user={mergedUser}
                  onManage={handleManage}
                  onSignOut={handleSignOut}
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            key="sign-in"
            className={styles.btn}
            onClick={() => setSignedIn(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.2 }}
            type="button"
          >
            Sign in
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
