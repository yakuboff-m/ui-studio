'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { motion, useSpring, useMotionTemplate } from 'framer-motion';
import { MessageCircle, Share2, Menu, Command } from 'lucide-react';
import styles from './VerticalTooltipMenu.module.scss';

export interface TooltipMenuItem {
  id: string;
  icon: ReactNode;
  label: string;
  shortcut?: (string | ReactNode)[];
  hasBadge?: boolean;
  onClick?: () => void;
}

export type TooltipSide = 'right' | 'left' | 'top' | 'bottom';

export interface SpringConfig {
  type?: 'spring';
  stiffness?: number;
  damping?: number;
  mass?: number;
}

interface VtooltipContextType {
  iconRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  tooltipRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  tooltipParentRef: React.RefObject<HTMLDivElement | null>;
  tooltipPosition: any;
  clipPathTop: any;
  clipPathBottom: any;
  opacity: any;
  side: TooltipSide;
  onMouseEnterOnIcon: (e: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  setIconRef: (index: number, el: HTMLElement | null) => void;
  setTooltipRef: (index: number, el: HTMLElement | null) => void;
  registerContent: (index: number, content: ReactNode) => void;
  activeItemIndex: number | null;
}

const VtooltipContext = createContext<VtooltipContextType | null>(null);

export const useVtooltip = () => {
  const ctx = useContext(VtooltipContext);
  if (!ctx) {
    throw new Error('Vtooltip components must be used within VtooltipRoot');
  }
  return ctx;
};

/* ── 1. VtooltipRoot: orchestrates springs & clip-path calculation ── */
export interface VtooltipRootProps {
  children: ReactNode;
  items?: TooltipMenuItem[];
  side?: TooltipSide;
  springConfig?: SpringConfig;
  className?: string;
  onActiveChange?: (index: number) => void;
}

export const VtooltipRoot: React.FC<VtooltipRootProps> = ({
  children,
  items: directItems,
  side = 'right', // Tooltip on the RIGHT side by default as requested
  springConfig = { stiffness: 400, damping: 30, mass: 0.8 },
  className = '',
}) => {
  const iconRefs = useRef<(HTMLElement | null)[]>([]);
  const tooltipRefs = useRef<(HTMLElement | null)[]>([]);
  const tooltipParentRef = useRef<HTMLDivElement | null>(null);
  const registeredContentsRef = useRef<Map<number, ReactNode>>(new Map());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Motion spring values
  const tooltipPosition = useSpring(0, { stiffness: 350, damping: 30 });
  const clipPathTop = useSpring(0, springConfig);
  const clipPathBottom = useSpring(79, springConfig);
  const opacity = useSpring(0, { stiffness: 320, damping: 28, mass: 0.8 });

  const totalItemsCount = directItems ? directItems.length : registeredContentsRef.current.size;

  const calculateClipPath = useCallback(
    (index: number | null) => {
      if (index === null) {
        clipPathTop.set(0);
        clipPathBottom.set(0);
        opacity.set(0);
        return;
      }

      const isVertical = side === 'left' || side === 'right';
      const itemsList = tooltipRefs.current;
      const count = totalItemsCount;

      if (isVertical) {
        let topSum = 0;
        for (let r = 0; r < index; r++) {
          topSum += itemsList[r]?.getBoundingClientRect().height || 36;
        }

        let bottomSum = 0;
        for (let t = index + 1; t < count; t++) {
          bottomSum += itemsList[t]?.getBoundingClientRect().height || 36;
        }

        const totalH = itemsList.slice(0, count).reduce(
          (acc, el) => acc + (el?.getBoundingClientRect().height || 36),
          0
        );

        const topPercent = totalH > 0 ? (topSum / totalH) * 100 : 0;
        const bottomPercent = totalH > 0 ? (bottomSum / totalH) * 100 : 0;

        clipPathTop.set(topPercent);
        clipPathBottom.set(bottomPercent);
      } else {
        let leftSum = 0;
        for (let r = 0; r < index; r++) {
          leftSum += itemsList[r]?.getBoundingClientRect().width || 60;
        }

        let rightSum = 0;
        for (let t = index + 1; t < count; t++) {
          rightSum += itemsList[t]?.getBoundingClientRect().width || 60;
        }

        const totalW = itemsList.slice(0, count).reduce(
          (acc, el) => acc + (el?.getBoundingClientRect().width || 60),
          0
        );

        const leftPercent = totalW > 0 ? (leftSum / totalW) * 100 : 0;
        const rightPercent = totalW > 0 ? (rightSum / totalW) * 100 : 0;

        clipPathTop.set(leftPercent);
        clipPathBottom.set(rightPercent);
      }

      opacity.set(1);
    },
    [side, totalItemsCount, clipPathTop, clipPathBottom, opacity]
  );

  const onMouseEnterOnIcon = useCallback(
    (_e: React.MouseEvent, index: number) => {
      setActiveItemIndex(index);
      const iconRect = iconRefs.current[index]?.getBoundingClientRect();
      const tooltipItemRect = tooltipRefs.current[index]?.getBoundingClientRect();
      const parentRect = tooltipParentRef.current?.getBoundingClientRect();

      if (iconRect && tooltipItemRect && parentRect) {
        const isVertical = side === 'left' || side === 'right';

        if (isVertical) {
          let offsetBefore = 0;
          for (let r = 0; r < index; r++) {
            offsetBefore += tooltipRefs.current[r]?.getBoundingClientRect().height || 36;
          }
          const iconCenterY = iconRect.top + iconRect.height / 2;
          const tooltipItemH = tooltipItemRect.height || 36;
          const tooltipCenterY = parentRect.top + offsetBefore + tooltipItemH / 2;
          tooltipPosition.set(iconCenterY - tooltipCenterY);
        } else {
          let offsetBefore = 0;
          for (let r = 0; r < index; r++) {
            offsetBefore += tooltipRefs.current[r]?.getBoundingClientRect().width || 60;
          }
          const iconCenterX = iconRect.left + iconRect.width / 2;
          const tooltipItemW = tooltipItemRect.width || 60;
          const tooltipCenterX = parentRect.left + offsetBefore + tooltipItemW / 2;
          tooltipPosition.set(iconCenterX - tooltipCenterX);
        }
      }

      calculateClipPath(index);
    },
    [side, tooltipPosition, calculateClipPath]
  );

  const onMouseLeave = useCallback(() => {
    setActiveItemIndex(null);
    opacity.set(0);
  }, [opacity]);

  const setIconRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) iconRefs.current[index] = el;
  }, []);

  const setTooltipRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) tooltipRefs.current[index] = el;
  }, []);

  const registerContent = useCallback((index: number, content: ReactNode) => {
    if (registeredContentsRef.current.get(index) !== content) {
      registeredContentsRef.current.set(index, content);
      forceUpdate();
    }
  }, []);

  const isVertical = side === 'left' || side === 'right';

  // Dynamic template for spring-based clip-path animation
  const verticalClipPath = useMotionTemplate`inset(${clipPathTop}% 0% ${clipPathBottom}% 0% round 10px)`;
  const horizontalClipPath = useMotionTemplate`inset(0% ${clipPathBottom}% 0% ${clipPathTop}% round 10px)`;

  const sideClass =
    side === 'right'
      ? styles.sideRight
      : side === 'left'
      ? styles.sideLeft
      : side === 'top'
      ? styles.sideTop
      : styles.sideBottom;

  // Tooltip content items
  const renderedTooltips = directItems
    ? directItems.map((item, idx) => ({
        idx,
        content: (
          <div className={styles.tooltipContent}>
            <span className={styles.tooltipLabel}>{item.label}</span>
            {item.shortcut && item.shortcut.length > 0 && (
              <span className={styles.shortcutGroup}>
                {item.shortcut.map((key, kIdx) => (
                  <kbd key={kIdx} className={styles.keyCap}>
                    {key}
                  </kbd>
                ))}
              </span>
            )}
          </div>
        ),
      }))
    : Array.from(registeredContentsRef.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([idx, content]) => ({ idx, content }));

  return (
    <VtooltipContext.Provider
      value={{
        iconRefs,
        tooltipRefs,
        tooltipParentRef,
        tooltipPosition,
        clipPathTop,
        clipPathBottom,
        opacity,
        side,
        onMouseEnterOnIcon,
        onMouseLeave,
        setIconRef,
        setTooltipRef,
        registerContent,
        activeItemIndex,
      }}
    >
      <div className={`${styles.wrapper} ${className}`}>
        {/* Tooltip Floating Card Container */}
        <div ref={tooltipParentRef} className={`${styles.tooltipParent} ${sideClass}`}>
          <motion.div
            className={`${styles.tooltipContainer} ${
              isVertical ? styles.verticalFlow : styles.horizontalFlow
            }`}
            style={
              isVertical
                ? {
                    opacity,
                    y: tooltipPosition,
                    clipPath: verticalClipPath,
                  }
                : {
                    opacity,
                    x: tooltipPosition,
                    clipPath: horizontalClipPath,
                  }
            }
          >
            {renderedTooltips.map(({ idx, content }) => (
              <div
                key={idx}
                ref={(el) => setTooltipRef(idx, el)}
                className={`${styles.tooltipItem} ${
                  isVertical ? '' : styles.horizontalItem
                }`}
              >
                {content}
              </div>
            ))}
          </motion.div>
        </div>

        {children}
      </div>
    </VtooltipContext.Provider>
  );
};

/* ── 2. VtooltipItem: links trigger and content at given index ── */
export interface VtooltipItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const VtooltipItem: React.FC<VtooltipItemProps> = ({
  children,
  index,
  className = '',
}) => {
  const { registerContent } = useVtooltip();
  const contentRef = useRef<ReactNode>(null);

  useEffect(() => {
    let contentElement: ReactNode = null;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<{ children?: ReactNode }>(child) && child.type === VtooltipContent) {
        contentElement = child.props.children;
      }
    });

    if (contentElement && contentRef.current !== contentElement) {
      contentRef.current = contentElement;
      registerContent(index, contentElement);
    }
  }, [children, index, registerContent]);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<{ children?: ReactNode }>(child) && child.type === VtooltipTrigger) {
          return <VtooltipTriggerButton index={index}>{child.props.children}</VtooltipTriggerButton>;
        }
        return null;
      })}
    </div>
  );
};

/* ── 3. VtooltipTrigger & Content primitives ── */
export const VtooltipTrigger: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const VtooltipContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
}) => {
  return <>{children}</>;
};

const VtooltipTriggerButton: React.FC<{ index: number; children: ReactNode }> = ({
  index,
  children,
}) => {
  const { onMouseEnterOnIcon, onMouseLeave, setIconRef } = useVtooltip();

  return (
    <div
      ref={(el) => setIconRef(index, el)}
      onMouseEnter={(e) => onMouseEnterOnIcon(e, index)}
      onMouseLeave={onMouseLeave}
      style={{ display: 'inline-flex' }}
    >
      {children}
    </div>
  );
};

/* ── 4. Full Turnkey Component: VerticalTooltipMenu ── */
export interface VerticalTooltipMenuProps {
  items?: TooltipMenuItem[];
  side?: TooltipSide;
  activeId?: string;
  defaultActiveId?: string;
  onSelect?: (id: string) => void;
  springConfig?: SpringConfig;
  className?: string;
}

export const DEFAULT_SKIPER98_ITEMS: TooltipMenuItem[] = [
  {
    id: 'comment',
    label: 'Comment',
    icon: <MessageCircle size={18} />,
    shortcut: ['C'],
    hasBadge: false,
  },
  {
    id: 'share',
    label: 'Share',
    icon: <Share2 size={18} />,
    hasBadge: false,
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: <Menu size={18} />,
    shortcut: [<Command key="cmd" size={11} />, 'K'],
    hasBadge: true,
  },
];

export const VerticalTooltipMenu: React.FC<VerticalTooltipMenuProps> = ({
  items = DEFAULT_SKIPER98_ITEMS,
  side = 'right', // User explicitly requested tooltip on RIGHT side
  activeId,
  defaultActiveId = 'menu',
  onSelect,
  springConfig = { stiffness: 400, damping: 30, mass: 0.8 },
  className = '',
}) => {
  const [selectedId, setSelectedId] = useState<string>(defaultActiveId);
  const currentActiveId = activeId !== undefined ? activeId : selectedId;

  const handleItemClick = (item: TooltipMenuItem) => {
    setSelectedId(item.id);
    if (onSelect) onSelect(item.id);
    if (item.onClick) item.onClick();
  };

  return (
    <VtooltipRoot items={items} side={side} springConfig={springConfig} className={className}>
      <NavContent
        items={items}
        currentActiveId={currentActiveId}
        handleItemClick={handleItemClick}
      />
    </VtooltipRoot>
  );
};

const NavContent: React.FC<{
  items: TooltipMenuItem[];
  currentActiveId: string;
  handleItemClick: (item: TooltipMenuItem) => void;
}> = ({ items, currentActiveId, handleItemClick }) => {
  const { onMouseLeave } = useVtooltip();

  return (
    <nav
      aria-label="Vertical navigation dock"
      className={styles.dock}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, idx) => {
        const isSelected = currentActiveId === item.id;
        const showBadge = item.hasBadge || isSelected;

        return (
          <VtooltipItem key={item.id} index={idx}>
            <VtooltipTrigger>
              <button
                type="button"
                className={styles.itemBtn}
                onClick={() => handleItemClick(item)}
                aria-label={item.label}
                aria-current={isSelected ? 'page' : undefined}
              >
                <span className={styles.itemIconWrapper}>
                  {item.icon}
                  {showBadge && <span className={styles.badge} aria-hidden="true" />}
                </span>
                <span className={styles.srOnly}>{item.label}</span>
              </button>
            </VtooltipTrigger>
          </VtooltipItem>
        );
      })}
    </nav>
  );
};

export default VerticalTooltipMenu;
