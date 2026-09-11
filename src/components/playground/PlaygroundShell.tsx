'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, IconButton, Tooltip, TextField, InputAdornment, Button } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import WidgetsIcon from '@mui/icons-material/Widgets';
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import { Home, Bell, SlidersHorizontal, Bookmark, Shield, Volume2 } from 'lucide-react';
import { Slider, Switch as MuiSwitchControl } from '@mui/material';

import { RegisteredComponent, PropControlValue } from './types';
import { Canvas, CanvasDeviceMode } from './Canvas';
import { ControlPanel } from './ControlPanel';
import { CodeViewer } from './CodeViewer';
import { useThemeMode } from '@/theme/ThemeRegistry';

import {
  CustomButton,
  CustomCard,
  CustomInput,
  CustomBadge,
  CustomSwitch,
  SmoothInput,
  GooeyInput,
  ExpandableTabs,
  MarketplaceDock,
  ResizableMarketplaceNav,
  VerticalTooltipMenu,
  NotificationStack,
  FlipWords,
  SimpleSidebar,
  FAQ,
  NavbarHover,
  BentoExpand,
  CopyButton,
} from '@/components/ui';


import {
  FULL_RESIZABLE_NAV_TSX,
  FULL_RESIZABLE_NAV_SCSS,
  FULL_MARKETPLACE_DOCK_TSX,
  FULL_MARKETPLACE_DOCK_SCSS,
  FULL_EXPANDABLE_TABS_TSX,
  FULL_EXPANDABLE_TABS_SCSS,
  FULL_SMOOTH_INPUT_TSX,
  FULL_SMOOTH_INPUT_SCSS,
  FULL_CUSTOM_BUTTON_TSX,
  FULL_CUSTOM_BUTTON_SCSS,
  FULL_CUSTOM_CARD_TSX,
  FULL_CUSTOM_CARD_SCSS,
  FULL_CUSTOM_INPUT_TSX,
  FULL_CUSTOM_INPUT_SCSS,
  FULL_CUSTOM_BADGE_TSX,
  FULL_CUSTOM_BADGE_SCSS,
  FULL_CUSTOM_SWITCH_TSX,
  FULL_CUSTOM_SWITCH_SCSS,
  FULL_GOOEY_INPUT_TSX,
  FULL_GOOEY_INPUT_SCSS,
  FULL_VERTICAL_TOOLTIP_TSX,
  FULL_VERTICAL_TOOLTIP_SCSS,
  FULL_NOTIFICATION_STACK_TSX,
  FULL_NOTIFICATION_STACK_SCSS,
  FULL_FLIP_WORDS_TSX,
  FULL_FLIP_WORDS_SCSS,
  FULL_SIDEBAR_TSX,
  FULL_SIDEBAR_SCSS,
  FULL_FAQ_TSX,
  FULL_FAQ_SCSS,
  FULL_NAVBAR_HOVER_TSX,
  FULL_NAVBAR_HOVER_SCSS,
  FULL_BENTO_EXPAND_TSX,
  FULL_BENTO_EXPAND_SCSS,
  FULL_COPY_BUTTON_TSX,
  FULL_COPY_BUTTON_SCSS,
} from './componentSources';


import styles from './PlaygroundShell.module.scss';

const SKIPER96_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home size={18} />,
    content: (
      <Box sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Skiper UI #96 Expandable Tabs: Exact single-card container with compact dock row.
        </Typography>
      </Box>
    ),
  },
  {
    id: 'notifications',
    label: 'Alerts',
    icon: <Bell size={18} />,
    content: (
      <Box sx={{ py: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Push Notifications</Typography>
          <MuiSwitchControl size="small" defaultChecked />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Email Digests</Typography>
          <MuiSwitchControl size="small" />
        </Box>
      </Box>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SlidersHorizontal size={18} />,
    content: (
      <Box sx={{ py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Volume2 size={16} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Volume</Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8 }}>50%</Typography>
        </Box>
        <Slider defaultValue={50} size="small" sx={{ mb: 1.5, color: '#3b82f6' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Dark Mode</Typography>
          <MuiSwitchControl size="small" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Notifications</Typography>
          <MuiSwitchControl size="small" defaultChecked />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Auto Save</Typography>
          <MuiSwitchControl size="small" defaultChecked />
        </Box>
      </Box>
    ),
  },
  {
    id: 'bookmarks',
    label: 'Saved',
    icon: <Bookmark size={18} />,
    content: (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Saved Components</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>4 items saved to your workspace library.</Typography>
      </Box>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield size={18} />,
    content: (
      <Box sx={{ py: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>2FA Security</Typography>
          <MuiSwitchControl size="small" defaultChecked />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Biometric Auth</Typography>
          <MuiSwitchControl size="small" defaultChecked />
        </Box>
      </Box>
    ),
  },
];

const COMPONENT_REGISTRY: RegisteredComponent[] = [
  {
    id: 'bento-expand',
    name: 'Feature Expand Bento',
    category: 'Layout',
    description: 'Motion.dev "Feature expand bento" — bento grid of feature cards that expand in place into a detail modal using Framer Motion shared-element layoutId animation.',
    controls: [
      { name: 'heading', type: 'text', defaultValue: 'See what changed.' },
      { name: 'subheading', type: 'text', defaultValue: 'Six surfaces, one line to install. Open any card to go deeper.' },
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
    ],
    render: (props) => (
      <Box sx={{ width: '100%', minHeight: 640, overflow: 'auto' }}>
        <BentoExpand
          heading={String(props.heading || 'See what changed.')}
          subheading={String(props.subheading || '')}
          theme={props.theme as any}
          style={{ width: '100%', minHeight: '100%' }}
        />
      </Box>
    ),
    generateCode: (props) =>
      `import React from 'react';\nimport { BentoExpand } from '@/components/ui/BentoExpand';\n\nexport function BentoExpandDemo() {\n  return (\n    <BentoExpand\n      heading="${props.heading || 'See what changed.'}"\n      subheading="${props.subheading || ''}"\n      theme="${props.theme || 'auto'}"\n    />\n  );\n}`,
    sourceCode: FULL_BENTO_EXPAND_TSX,
    scssCode: FULL_BENTO_EXPAND_SCSS,
  },
  {
    id: 'copy-button',
    name: 'Copy Button',
    category: 'Actions',
    description: 'Motion.dev copy button — clipboard icon transitions to a drawn SVG checkmark via pathLength animation, with blur fade between states and a smooth pill-width layout morph. Resets after 2s.',
    controls: [
      { name: 'value', type: 'text', defaultValue: 'Hello, world!' },
      { name: 'label', type: 'text', defaultValue: 'Copy' },
      { name: 'copiedLabel', type: 'text', defaultValue: 'Copied!' },
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
    ],
    render: (props) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CopyButton
          value={String(props.value || 'Hello, world!')}
          label={String(props.label || 'Copy')}
          copiedLabel={String(props.copiedLabel || 'Copied!')}
          theme={props.theme as any}
        />
      </Box>
    ),
    generateCode: (props) =>
      `import { CopyButton } from '@/components/ui/CopyButton';\n\nexport function CopyButtonDemo() {\n  return (\n    <CopyButton\n      value="${props.value || 'Hello, world!'}"\n      label="${props.label || 'Copy'}"\n      copiedLabel="${props.copiedLabel || 'Copied!'}"\n      theme="${props.theme || 'auto'}"\n    />\n  );\n}`,
    sourceCode: FULL_COPY_BUTTON_TSX,
    scssCode: FULL_COPY_BUTTON_SCSS,
  },
  {
    id: 'navbar-hover',
    name: 'Navbar with Hover Effect',
    category: 'Navigation',
    description: '1:1 Aceternity UI "Navbar with hover effect". Pill-shaped dark navbar with a smooth sliding background pill that glides between nav items on hover. Logo, nav links, and CTA button.',
    controls: [
      { name: 'logoText', type: 'text', defaultValue: 'DevStudio' },
      { name: 'ctaLabel', type: 'text', defaultValue: 'Book a call' },
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
    ],
    render: (props) => (
      <Box sx={{ width: '100%', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <NavbarHover
          logoText={String(props.logoText || 'DevStudio')}
          ctaLabel={String(props.ctaLabel || 'Book a call')}
          theme={props.theme as any}
          style={{ width: '100%' }}
        />
      </Box>
    ),
    generateCode: (props) =>
      `import React from 'react';\nimport { NavbarHover } from '@/components/ui/NavbarHover';\n\nexport function NavbarHoverDemo() {\n  return (\n    <NavbarHover\n      logoText="${props.logoText || 'DevStudio'}"\n      ctaLabel="${props.ctaLabel || 'Book a call'}"\n      theme="${props.theme || 'auto'}"\n    />\n  );\n}`,
    sourceCode: FULL_NAVBAR_HOVER_TSX,
    scssCode: FULL_NAVBAR_HOVER_SCSS,
  },
  {
    id: 'simple-sidebar',

    name: 'Simple Sidebar',
    category: 'Layout',
    description: '1:1 Aceternity UI Simple Sidebar with floating hover pill highlight, mobile drawer, user profile, and responsive dashboard layout.',
    controls: [
      { name: 'collapsible', type: 'boolean', defaultValue: false, description: 'Toggle collapsible 68px/280px mode with expand button' },
      { name: 'logoTitle', type: 'text', defaultValue: 'Acet Labs' },
      { name: 'userName', type: 'text', defaultValue: 'Manu Arora' },
      { name: 'userRole', type: 'text', defaultValue: 'manu@aceternity.com' },
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
    ],
    render: (props) => {
      return (
        <Box sx={{ width: '100%', height: { xs: 560, md: 680 }, overflow: 'hidden', borderRadius: '12px' }}>
          <SimpleSidebar
            collapsible={Boolean(props.collapsible)}
            logoTitle={String(props.logoTitle || 'Acet Labs')}
            userName={String(props.userName || 'Manu Arora')}
            userRole={String(props.userRole || 'manu@aceternity.com')}
            theme={props.theme as any}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      );
    },
    generateCode: (props) => {
      return `import React from 'react';\nimport { SimpleSidebar } from '@/components/ui/Sidebar';\n\nexport function SimpleSidebarDemo() {\n  return (\n    <div className="h-screen w-full">\n      <SimpleSidebar\n        collapsible={${Boolean(props.collapsible)}}\n        logoTitle="${props.logoTitle || 'Acet Labs'}"\n        userName="${props.userName || 'Manu Arora'}"\n        userRole="${props.userRole || 'manu@aceternity.com'}"\n      />\n    </div>\n  );\n}`;
    },
    sourceCode: FULL_SIDEBAR_TSX,
    scssCode: FULL_SIDEBAR_SCSS,
  },
  {
    id: 'faq',
    name: 'FAQ Accordion',
    category: 'Layout',
    description: 'Combined Aceternity "Simple FAQs with Background" + "FAQs with dashed lines". Section headers, dashed borders, +/× toggle, and word-by-word AI typewriter reveal on expand.',
    controls: [
      { name: 'title', type: 'text', defaultValue: 'Frequently Asked Questions' },
      { name: 'subtitle', type: 'text', defaultValue: 'Everything you need to know about deploying AI agents and automating your workflows.' },
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
    ],
    render: (props) => (
      <Box sx={{ width: '100%', minHeight: 600, overflow: 'auto' }}>
        <FAQ
          title={String(props.title || 'Frequently Asked Questions')}
          subtitle={String(props.subtitle || '')}
          theme={props.theme as any}
          style={{ width: '100%', minHeight: '100%' }}
        />
      </Box>
    ),
    generateCode: (props) =>
      `import React from 'react';\nimport { FAQ } from '@/components/ui/FAQ';\n\nexport function FAQDemo() {\n  return (\n    <FAQ\n      title="${props.title || 'Frequently Asked Questions'}"\n      subtitle="${props.subtitle || ''}"\n      theme="${props.theme || 'auto'}"\n    />\n  );\n}`,
    sourceCode: FULL_FAQ_TSX,
    scssCode: FULL_FAQ_SCSS,
  },
  {
    id: 'flip-words',
    name: 'Flip Words',
    category: 'Text Animations',
    description: '1:1 Aceternity UI Flip Words text animation. Transitions smoothly through a list of words with letter-by-letter blur and spring physics.',
    controls: [
      { name: 'words', type: 'text', defaultValue: 'better, cute, beautiful, modern' },
      { name: 'duration', type: 'number', defaultValue: 2500 },
      { name: 'prefix', type: 'text', defaultValue: 'Build' },
      { name: 'suffix', type: 'text', defaultValue: 'websites with Aceternity UI' },
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
    ],
    render: (props) => {
      const wordsList = String(props.words || 'better, cute, beautiful, modern')
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);

      return (
        <Box
          sx={{
            width: '100%',
            minHeight: 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 4 },
            py: 6,
            textAlign: 'center',
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
              fontWeight: 400,
              lineHeight: 1.35,
              letterSpacing: '-0.025em',
              color: 'text.secondary',
              maxWidth: 780,
              mx: 'auto',
            }}
          >
            {props.prefix ? `${props.prefix} ` : ''}
            <FlipWords
              words={wordsList.length > 0 ? wordsList : ['better', 'cute', 'beautiful', 'modern']}
              duration={Number(props.duration) || 2500}
              theme={props.theme as any}
            />
            {props.suffix ? (
              <>
                <br />
                {props.suffix}
              </>
            ) : null}
          </Typography>
        </Box>
      );
    },
    generateCode: (props) => {
      const wordsList = String(props.words || 'better, cute, beautiful, modern')
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);
      const wordsArrStr = JSON.stringify(wordsList.length ? wordsList : ['better', 'cute', 'beautiful', 'modern']);
      return `import React from 'react';\nimport { FlipWords } from '@/components/ui/FlipWords';\n\nexport function FlipWordsDemo() {\n  const words = ${wordsArrStr};\n\n  return (\n    <div className="flex justify-center items-center px-4 py-16">\n      <div className="text-4xl font-normal text-neutral-600 dark:text-neutral-400 text-center">\n        ${props.prefix || 'Build'}{' '}\n        <FlipWords words={words} duration={${props.duration || 2500}} /> <br />\n        ${props.suffix || 'websites with Aceternity UI'}\n      </div>\n    </div>\n  );\n}`;
    },
    sourceCode: FULL_FLIP_WORDS_TSX,
    scssCode: FULL_FLIP_WORDS_SCSS,
  },
  {
    id: 'notification-stack',
    name: 'Notification Stack',
    category: 'Feedback',
    description: '1:1 Motion UI List Notifications Stack. Expandable stacked cards with custom spring physics, layout animation, peek layers, and collapse header toggle.',
    controls: [
      { name: 'theme', type: 'select', defaultValue: 'auto', options: ['auto', 'dark', 'light'] },
      { name: 'count', type: 'number', defaultValue: 3 },
      { name: 'cardWidth', type: 'number', defaultValue: 350 },
      { name: 'cardHeight', type: 'number', defaultValue: 84 },
      { name: 'cardGap', type: 'number', defaultValue: 10 },
      { name: 'scaleStep', type: 'number', defaultValue: 0.08 },
      { name: 'dimStep', type: 'number', defaultValue: 0.4 },
    ],
    render: (props) => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <NotificationStack
          theme={props.theme as any}
          count={Number(props.count) || 3}
          cardWidth={Number(props.cardWidth) || 350}
          cardHeight={Number(props.cardHeight) || 84}
          cardGap={Number(props.cardGap) || 10}
          scaleStep={Number(props.scaleStep) || 0.08}
          dimStep={Number(props.dimStep) || 0.4}
        />
      </Box>
    ),
    generateCode: (props) =>
      `<NotificationStack\n  theme="${props.theme || 'auto'}"\n  count={${props.count || 3}}\n  cardWidth={${props.cardWidth || 350}}\n  cardHeight={${props.cardHeight || 84}}\n  cardGap={${props.cardGap || 10}}\n  scaleStep={${props.scaleStep || 0.08}}\n  dimStep={${props.dimStep || 0.4}}\n/>`,
    sourceCode: FULL_NOTIFICATION_STACK_TSX,
    scssCode: FULL_NOTIFICATION_STACK_SCSS,
  },
  {
    id: 'resizable-marketplace-nav',
    name: 'Resizable Navbar & Sticky Dock',
    category: 'Navigation',
    description: 'Composite experience: Resizable top navbar with large search bar & 3 actions (cart, notifications, blue avatar K) combined with bottom sticky Marketplace Dock that morphs into Gooey Input on scroll down.',
    controls: [
      { name: 'topPlaceholder', type: 'text', defaultValue: 'Search curated marketplace products, brands, or categories…' },
      { name: 'scrollThreshold', type: 'number', defaultValue: 80 },
    ],
    render: (props) => (
      <Box sx={{ width: '100%', my: 0 }}>
        <ResizableMarketplaceNav
          topPlaceholder={String(props.topPlaceholder)}
          scrollThreshold={Number(props.scrollThreshold) || 80}
        />
      </Box>
    ),
    generateCode: (props) =>
      `<ResizableMarketplaceNav\n  topPlaceholder="${props.topPlaceholder}"\n  scrollThreshold={${props.scrollThreshold}}\n/>`,
    sourceCode: FULL_RESIZABLE_NAV_TSX,
    scssCode: FULL_RESIZABLE_NAV_SCSS,
  },
  {
    id: 'marketplace-dock',
    name: 'Marketplace Dock',
    category: 'Navigation',
    description: 'Custom marketplace dock with Home, Posts, Search (smooth caret), Filter (popover), More (popover), and Profile.',
    controls: [],
    render: () => <MarketplaceDock />,
    generateCode: () => `<MarketplaceDock />`,
    sourceCode: FULL_MARKETPLACE_DOCK_TSX,
    scssCode: FULL_MARKETPLACE_DOCK_SCSS,
  },
  {
    id: 'skiper96-expandable-tabs',
    name: 'Expandable Tabs',
    category: 'Navigation',
    description: 'Expandable tabs navigation with dynamic spring expansion and content transitions.',
    controls: [
      { name: 'defaultTab', type: 'select', defaultValue: 'home', options: ['home', 'notifications', 'settings', 'messages', 'profile'] },
    ],
    render: (props) => (
      <ExpandableTabs
        items={SKIPER96_ITEMS}
        defaultValue={String(props.defaultTab || 'home')}
      />
    ),
    generateCode: (props) =>
      `<ExpandableTabs\n  items={items}\n  defaultValue="${props.defaultTab || 'home'}"\n/>`,
    sourceCode: FULL_EXPANDABLE_TABS_TSX,
    scssCode: FULL_EXPANDABLE_TABS_SCSS,
  },
  {
    id: 'skiper98-vertical-tooltip',
    name: 'Vertical Tooltip Menu',
    category: 'Navigation',
    description: 'Skiper UI 98 animated vertical tooltip menu with smooth clip-path spring reveals, keyboard shortcuts, and right-side tooltip positioning.',
    controls: [
      { name: 'side', type: 'select', defaultValue: 'right', options: ['right', 'left', 'top', 'bottom'] },
      { name: 'defaultActiveId', type: 'select', defaultValue: 'menu', options: ['comment', 'share', 'menu'] },
      { name: 'stiffness', type: 'number', defaultValue: 400 },
      { name: 'damping', type: 'number', defaultValue: 30 },
    ],
    render: (props) => (
      <Box sx={{ py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 300 }}>
        <VerticalTooltipMenu
          side={(props.side as any) || 'right'}
          defaultActiveId={String(props.defaultActiveId || 'menu')}
          springConfig={{
            stiffness: Number(props.stiffness) || 400,
            damping: Number(props.damping) || 30,
            mass: 0.8,
          }}
        />
      </Box>
    ),
    generateCode: (props) =>
      `<VerticalTooltipMenu\n  side="${props.side || 'right'}"\n  defaultActiveId="${props.defaultActiveId || 'menu'}"\n  springConfig={{\n    stiffness: ${props.stiffness || 400},\n    damping: ${props.damping || 30},\n    mass: 0.8,\n  }}\n/>`,
    sourceCode: FULL_VERTICAL_TOOLTIP_TSX,
    scssCode: FULL_VERTICAL_TOOLTIP_SCSS,
  },
  {
    id: 'smooth-input',
    name: 'Smooth Caret Input',
    category: 'Inputs',
    description: 'Smooth Caret Input featuring spring-physics animated cursor indicator and realtime text measuring.',
    controls: [
      { name: 'placeholder', type: 'text', defaultValue: 'Type smooth text here…' },
      { name: 'type', type: 'select', defaultValue: 'text', options: ['text', 'password'] },
    ],
    render: (props) => (
      <Box sx={{ width: 360 }}>
        <SmoothInput
          type={props.type as any}
          placeholder={String(props.placeholder)}
        />
      </Box>
    ),
    generateCode: (props) =>
      `<SmoothInput\n  type="${props.type}"\n  placeholder="${props.placeholder}"\n/>`,
    sourceCode: FULL_SMOOTH_INPUT_TSX,
    scssCode: FULL_SMOOTH_INPUT_SCSS,
  },
  {
    id: 'gooey-input',
    name: 'Gooey Search Input',
    category: 'Inputs',
    description: 'Aceternity-style search input expanding with organic SVG gooey filter physics and detached floating search bubble.',
    controls: [
      { name: 'placeholder', type: 'text', defaultValue: 'Type to search...' },
      { name: 'collapsedWidth', type: 'number', defaultValue: 115 },
      { name: 'expandedWidth', type: 'number', defaultValue: 200 },
      { name: 'expandedOffset', type: 'number', defaultValue: 50 },
      { name: 'gooeyBlur', type: 'number', defaultValue: 5 },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    render: (props) => (
      <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 120 }}>
        <GooeyInput
          placeholder={String(props.placeholder)}
          collapsedWidth={Number(props.collapsedWidth) || 115}
          expandedWidth={Number(props.expandedWidth) || 200}
          expandedOffset={Number(props.expandedOffset) || 50}
          gooeyBlur={Number(props.gooeyBlur) || 5}
          disabled={Boolean(props.disabled)}
        />
      </Box>
    ),
    generateCode: (props) =>
      `<GooeyInput\n  placeholder="${props.placeholder}"\n  collapsedWidth={${props.collapsedWidth}}\n  expandedWidth={${props.expandedWidth}}\n  expandedOffset={${props.expandedOffset}}\n  gooeyBlur={${props.gooeyBlur}}${props.disabled ? '\n  disabled' : ''}\n/>`,
    sourceCode: FULL_GOOEY_INPUT_TSX,
    scssCode: FULL_GOOEY_INPUT_SCSS,
  },
  {
    id: 'custom-button',
    name: 'Glow Action Button',
    category: 'Actions',
    description: 'Modern animated button with MUI base & SCSS glow effects.',
    controls: [
      { name: 'children', type: 'text', defaultValue: 'Get Started Now' },
      { name: 'variant', type: 'select', defaultValue: 'glow', options: ['glow', 'glass', 'neon', 'contained', 'outlined', 'text'] },
      { name: 'size', type: 'select', defaultValue: 'medium', options: ['small', 'medium', 'large'] },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'loading', type: 'boolean', defaultValue: false },
      { name: 'pulse', type: 'boolean', defaultValue: false },
    ],
    render: (props) => (
      <CustomButton
        variant={props.variant as any}
        size={props.size as any}
        disabled={Boolean(props.disabled)}
        loading={Boolean(props.loading)}
        pulse={Boolean(props.pulse)}
      >
        {String(props.children)}
      </CustomButton>
    ),
    generateCode: (props) =>
      `<CustomButton variant="${props.variant}" size="${props.size}"${props.pulse ? ' pulse' : ''}${props.loading ? ' loading' : ''}>\n  ${props.children}\n</CustomButton>`,
    sourceCode: FULL_CUSTOM_BUTTON_TSX,
    scssCode: FULL_CUSTOM_BUTTON_SCSS,
  },
  {
    id: 'custom-card',
    name: 'Glassmorphism Card',
    category: 'Layout',
    description: 'Glassmorphism container card with SCSS hover transitions and top glow accent.',
    controls: [
      { name: 'title', type: 'text', defaultValue: 'Performance Analytics' },
      { name: 'subtitle', type: 'text', defaultValue: 'Real-time telemetry and component stats' },
      { name: 'variantType', type: 'select', defaultValue: 'glass', options: ['glass', 'solid'] },
      { name: 'hover', type: 'boolean', defaultValue: true },
      { name: 'topGlow', type: 'boolean', defaultValue: true },
    ],
    render: (props) => (
      <CustomCard
        title={String(props.title)}
        subtitle={String(props.subtitle)}
        variantType={props.variantType as any}
        hover={Boolean(props.hover)}
        topGlow={Boolean(props.topGlow)}
        action={<CustomButton size="small" variant="glass">Details</CustomButton>}
        sx={{ minWidth: 320 }}
      >
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
          This is an example of a custom card component built using MUI Material surface base combined with SCSS glassmorphism modules.
        </Typography>
      </CustomCard>
    ),
    generateCode: (props) =>
      `<CustomCard\n  title="${props.title}"\n  subtitle="${props.subtitle}"\n  variantType="${props.variantType}"\n  hover={${props.hover}}\n  topGlow={${props.topGlow}}\n>\n  <Typography>Card content goes here...</Typography>\n</CustomCard>`,
    sourceCode: FULL_CUSTOM_CARD_TSX,
    scssCode: FULL_CUSTOM_CARD_SCSS,
  },
  {
    id: 'custom-input',
    name: 'Glow Outline Input',
    category: 'Inputs',
    description: 'Enhanced input field with focus glow ring and custom floating label styles.',
    controls: [
      { name: 'label', type: 'text', defaultValue: 'Project Workspace Name' },
      { name: 'placeholder', type: 'text', defaultValue: 'e.g. Acme Cloud Dashboard' },
      { name: 'disabled', type: 'boolean', defaultValue: false },
      { name: 'error', type: 'boolean', defaultValue: false },
      { name: 'helperText', type: 'text', defaultValue: 'Enter a unique identifier for your project' },
    ],
    render: (props) => (
      <Box sx={{ width: 340 }}>
        <CustomInput
          label={String(props.label)}
          placeholder={String(props.placeholder)}
          disabled={Boolean(props.disabled)}
          error={Boolean(props.error)}
          helperText={String(props.helperText)}
        />
      </Box>
    ),
    generateCode: (props) =>
      `<CustomInput\n  label="${props.label}"\n  placeholder="${props.placeholder}"\n  helperText="${props.helperText}"${props.error ? ' error' : ''}\n/>`,
    sourceCode: FULL_CUSTOM_INPUT_TSX,
    scssCode: FULL_CUSTOM_INPUT_SCSS,
  },
  {
    id: 'custom-badge',
    name: 'Status Pulse Badge',
    category: 'Data Display',
    description: 'Status indicator pill with animated pulsing dot.',
    controls: [
      { name: 'label', type: 'text', defaultValue: 'System Operational' },
      { name: 'status', type: 'select', defaultValue: 'active', options: ['active', 'busy', 'warning', 'gradient'] },
      { name: 'pulse', type: 'boolean', defaultValue: true },
    ],
    render: (props) => (
      <CustomBadge
        label={String(props.label)}
        status={props.status as any}
        pulse={Boolean(props.pulse)}
      />
    ),
    generateCode: (props) =>
      `<CustomBadge label="${props.label}" status="${props.status}" pulse={${props.pulse}} />`,
    sourceCode: FULL_CUSTOM_BADGE_TSX,
    scssCode: FULL_CUSTOM_BADGE_SCSS,
  },
  {
    id: 'custom-switch',
    name: 'Neon Toggle Switch',
    category: 'Inputs',
    description: 'Neon glowing toggle switch with SCSS slider track.',
    controls: [
      { name: 'label', type: 'text', defaultValue: 'Enable Turbo Accelerator' },
      { name: 'checked', type: 'boolean', defaultValue: true },
      { name: 'disabled', type: 'boolean', defaultValue: false },
    ],
    render: (props) => (
      <CustomSwitch
        label={String(props.label)}
        defaultChecked={Boolean(props.checked)}
        disabled={Boolean(props.disabled)}
      />
    ),
    generateCode: (props) =>
      `<CustomSwitch label="${props.label}" defaultChecked={${props.checked}} />`,
    sourceCode: FULL_CUSTOM_SWITCH_TSX,
    scssCode: FULL_CUSTOM_SWITCH_SCSS,
  },
];

export const PlaygroundShell: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mode, toggleTheme } = useThemeMode();

  const urlComponentId = searchParams.get('c') || searchParams.get('component') || null;
  const urlTab = (searchParams.get('tab') as 'preview' | 'controls' | 'code') || 'preview';

  const [selectedId, setSelectedId] = useState<string | null>(urlComponentId);
  const [showcaseTab, setShowcaseTab] = useState<'preview' | 'controls' | 'code'>(urlTab);
  const [deviceMode, setDeviceMode] = useState<CanvasDeviceMode>('desktop');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const canvasBg = mode === 'dark' ? 'mesh' : 'light';

  // Listen for Escape key to exit full window preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenPreview(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize state when URL changes (e.g. browser Back / Forward / Refresh)
  useEffect(() => {
    setSelectedId(urlComponentId);
    if (urlTab === 'preview' || urlTab === 'controls' || urlTab === 'code') {
      setShowcaseTab(urlTab);
    }
  }, [urlComponentId, urlTab]);

  const navigateToComponent = useCallback(
    (id: string | null, tab: 'preview' | 'controls' | 'code' = 'preview') => {
      setSelectedId(id);
      setShowcaseTab(tab);
      if (id) {
        router.push(`/?c=${encodeURIComponent(id)}&tab=${tab}`, { scroll: false });
      } else {
        router.push(`/`, { scroll: false });
      }
    },
    [router]
  );

  const switchTab = useCallback(
    (tab: 'preview' | 'controls' | 'code') => {
      setShowcaseTab(tab);
      if (selectedId) {
        router.replace(`/?c=${encodeURIComponent(selectedId)}&tab=${tab}`, { scroll: false });
      }
    },
    [router, selectedId]
  );

  // Maintain live prop values per component
  const [propState, setPropState] = useState<Record<string, Record<string, PropControlValue>>>(() => {
    const initialState: Record<string, Record<string, PropControlValue>> = {};
    COMPONENT_REGISTRY.forEach((comp) => {
      initialState[comp.id] = {};
      comp.controls.forEach((ctrl) => {
        initialState[comp.id][ctrl.name] = ctrl.defaultValue;
      });
    });
    return initialState;
  });

  const activeComponent = COMPONENT_REGISTRY.find((c) => c.id === selectedId) || null;
  const activeProps = activeComponent ? (propState[activeComponent.id] || {}) : {};

  const handlePropChange = (name: string, value: PropControlValue) => {
    if (!activeComponent) return;
    setPropState((prev) => ({
      ...prev,
      [activeComponent.id]: {
        ...prev[activeComponent.id],
        [name]: value,
      },
    }));
  };

  const categories = useMemo(() => ['All', ...Array.from(new Set(COMPONENT_REGISTRY.map((c) => c.category)))], []);

  const filteredComponents = useMemo(() => {
    return COMPONENT_REGISTRY.filter((c) => {
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <Box className={styles.shellContainer}>
      {/* ─── 1. Our Brand Top Floating Navbar ─── */}
      <Box className={styles.topNavWrapper}>
        <Box className={styles.topNavbar}>
          <Box className={styles.logoBrand} onClick={() => navigateToComponent(null)}>
            <WidgetsIcon sx={{ color: '#6366f1', fontSize: 24 }} />
            <span>Component Studio</span>
          </Box>

          <Box className={styles.navLinks}>
            <span
              className={`${styles.navLink} ${selectedId === null ? styles.activeLink : ''}`}
              onClick={() => navigateToComponent(null)}
            >
              Components
            </span>
            <span className={styles.navLink}>Docs</span>
            <span className={styles.navLink}>Pricing</span>
          </Box>

          <Box className={styles.navActions}>
            <button
              type="button"
              className={styles.cmdKBtn}
              onClick={() => navigateToComponent(null)}
            >
              <SearchIcon sx={{ fontSize: 15 }} />
              <span>Search components</span>
              <span className={styles.kbdTag}>⌘K</span>
            </button>

            <button
              type="button"
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {mode === 'dark' ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
            </button>
          </Box>
        </Box>
      </Box>

      {/* ─── 2. Main Page Content ─── */}
      <Box className={styles.mainContainer}>
        {selectedId === null || !activeComponent ? (
          /* GALLERY VIEW (Components Overview Layout) */
          <Box>
            {/* Hero Header */}
            <Box className={styles.heroSection}>
              <Typography className={styles.heroTitle}>
                Component Library
              </Typography>
              <Typography className={styles.heroSubtitle}>
                Browse our collection of interactive React & SCSS components. Filter by category or search for the perfect component.
              </Typography>

              {/* Search & Category Filter Controls */}
              <Box className={styles.filterControlsBar}>
                <TextField
                  size="small"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: 320 }}
                />

                <Box className={styles.categoryRow}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`${styles.catPill} ${selectedCategory === cat ? styles.activeCatPill : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Component Cards Grid */}
            <Box className={styles.componentsGrid}>
              {filteredComponents.map((comp) => (
                <Box key={comp.id} className={styles.componentCard}>
                  {/* Card Live Interactive Preview */}
                  <Box className={styles.cardPreviewCanvas} onClick={() => navigateToComponent(comp.id, 'preview')} sx={{ cursor: 'pointer' }}>
                    {comp.render(propState[comp.id] || {})}
                  </Box>

                  {/* Card Details */}
                  <Box className={styles.cardContent}>
                    <Box className={styles.cardTitleRow}>
                      <Typography className={styles.cardTitle}>{comp.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <span className={styles.tagBadge}>{comp.category}</span>
                        <span className={styles.tierBadge}>Free</span>
                      </Box>
                    </Box>

                    <Typography className={styles.cardDesc}>
                      {comp.description}
                    </Typography>

                    <Box className={styles.cardFooter}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<LaunchIcon fontSize="small" />}
                        onClick={() => navigateToComponent(comp.id, 'preview')}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: '#6366f1',
                          borderRadius: '10px',
                          '&:hover': { background: '#4f46e5' },
                        }}
                      >
                        Preview &amp; Controls
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CodeIcon fontSize="small" />}
                        onClick={() => navigateToComponent(comp.id, 'code')}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          borderRadius: '10px',
                        }}
                      >
                        Code
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          /* SINGLE COMPONENT SHOWCASE VIEW (Component Detail Layout) */
          <Box className={styles.componentPageWrap}>
            {/* Back Button */}
            <Box className={styles.backBtnRow}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => navigateToComponent(null)}
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} />
                <span>Back to components</span>
              </button>
            </Box>

            {/* Component Header Info */}
            <Box className={styles.compHeaderSection}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {activeComponent.name}
                </Typography>
                <span className={styles.tagBadge}>{activeComponent.category}</span>
                <span className={styles.tierBadge}>Free</span>
              </Box>

              <Typography variant="body1" sx={{ color: 'text.secondary', maxW: '680px' }}>
                {activeComponent.description}
              </Typography>
            </Box>

            {/* Single Showcase Container Box */}
            <Box className={styles.showcaseContainer}>
              {/* Container Top Header */}
              <Box className={styles.showcaseTopBar}>
                {/* Left: Preview vs Props vs Code Tab Segmented Switcher */}
                <Box className={styles.tabPillSegment}>
                  <button
                    type="button"
                    className={`${styles.showcaseTabBtn} ${showcaseTab === 'preview' ? styles.activeShowcaseTab : ''}`}
                    onClick={() => switchTab('preview')}
                  >
                    Preview
                  </button>
                  {activeComponent.controls.length > 0 && (
                    <button
                      type="button"
                      className={`${styles.showcaseTabBtn} ${showcaseTab === 'controls' ? styles.activeShowcaseTab : ''}`}
                      onClick={() => switchTab('controls')}
                    >
                      Props &amp; Controls ({activeComponent.controls.length})
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.showcaseTabBtn} ${showcaseTab === 'code' ? styles.activeShowcaseTab : ''}`}
                    onClick={() => switchTab('code')}
                  >
                    Code
                  </button>
                </Box>

                {/* Right: Device Mode Controls & Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {showcaseTab === 'preview' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Desktop (100%)">
                        <IconButton
                          size="small"
                          onClick={() => setDeviceMode('desktop')}
                          sx={{ color: deviceMode === 'desktop' ? '#6366f1' : 'text.secondary' }}
                        >
                          <DesktopWindowsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Tablet (768px)">
                        <IconButton
                          size="small"
                          onClick={() => setDeviceMode('tablet')}
                          sx={{ color: deviceMode === 'tablet' ? '#6366f1' : 'text.secondary' }}
                        >
                          <TabletIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mobile (375px)">
                        <IconButton
                          size="small"
                          onClick={() => setDeviceMode('mobile')}
                          sx={{ color: deviceMode === 'mobile' ? '#6366f1' : 'text.secondary' }}
                        >
                          <SmartphoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Full Window Preview">
                        <IconButton
                          size="small"
                          onClick={() => setIsFullscreenPreview(true)}
                          sx={{ color: 'text.secondary', ml: 0.5 }}
                        >
                          <OpenInFullIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Container Body */}
              <Box className={styles.showcaseBody}>
                {showcaseTab === 'preview' ? (
                  /* Full-width unconstrained Preview Canvas */
                  <Box className={styles.showcaseCanvasArea}>
                    <Canvas bgMode={canvasBg} deviceMode={deviceMode}>
                      {activeComponent.render(activeProps)}
                    </Canvas>
                  </Box>
                ) : showcaseTab === 'controls' ? (
                  /* Dedicated Props & Controls Tab */
                  <Box sx={{ flex: 1, p: { xs: 3, md: 5 }, maxWidth: 720, mx: 'auto', width: '100%', boxSizing: 'border-box' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
                      Props Inspector &amp; Controls
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5 }}>
                      Configure parameters and interactive props for <strong>{activeComponent.name}</strong>. Changes reflect immediately in the Preview tab.
                    </Typography>
                    <ControlPanel
                      controls={activeComponent.controls}
                      values={activeProps}
                      onChange={handlePropChange}
                    />
                  </Box>
                ) : (
                  /* Full Code Showcase View */
                  <Box sx={{ flex: 1, p: 3 }}>
                    <CodeViewer
                      usageCode={activeComponent.generateCode(activeProps)}
                      sourceCode={activeComponent.sourceCode}
                      scssCode={activeComponent.scssCode}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* ─── Full Window Preview Overlay ─── */}
      {isFullscreenPreview && activeComponent && (
        <Box className={styles.fullWindowOverlay}>
          {/* Floating Glass Navigation Bar */}
          <Box className={styles.fullWindowFloatingBar}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: 'text.primary', mr: 1, display: { xs: 'none', sm: 'block' } }}
            >
              {activeComponent.name}
            </Typography>

            {/* Device Switcher */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Desktop (100%)">
                <IconButton
                  size="small"
                  onClick={() => setDeviceMode('desktop')}
                  sx={{ color: deviceMode === 'desktop' ? '#6366f1' : 'text.secondary' }}
                >
                  <DesktopWindowsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Tablet (768px)">
                <IconButton
                  size="small"
                  onClick={() => setDeviceMode('tablet')}
                  sx={{ color: deviceMode === 'tablet' ? '#6366f1' : 'text.secondary' }}
                >
                  <TabletIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mobile (375px)">
                <IconButton
                  size="small"
                  onClick={() => setDeviceMode('mobile')}
                  sx={{ color: deviceMode === 'mobile' ? '#6366f1' : 'text.secondary' }}
                >
                  <SmartphoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Theme Toggle */}
            <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton size="small" onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Exit Fullscreen Button */}
            <Button
              size="small"
              variant="contained"
              startIcon={<FullscreenExitIcon fontSize="small" />}
              onClick={() => setIsFullscreenPreview(false)}
              sx={{
                borderRadius: 9999,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                py: 0.5,
                px: 1.5,
                background: mode === 'dark' ? '#ffffff' : '#0f172a',
                color: mode === 'dark' ? '#090d16' : '#ffffff',
                '&:hover': {
                  background: mode === 'dark' ? '#e2e8f0' : '#1e293b',
                },
              }}
            >
              Exit (Esc)
            </Button>
          </Box>

          {/* Full Window Unconstrained Component Render */}
          <Box className={styles.fullWindowContent}>
            <Canvas bgMode={canvasBg} deviceMode={deviceMode}>
              {activeComponent.render(activeProps)}
            </Canvas>
          </Box>
        </Box>
      )}
    </Box>
  );
};
