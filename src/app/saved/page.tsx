'use client';

import React, { Suspense } from 'react';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export default function SavedPage() {
  return (
    <Suspense fallback={null}>
      <PlaygroundShell initialView="saved" />
    </Suspense>
  );
}
