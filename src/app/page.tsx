'use client';

import React, { Suspense } from 'react';
import { PlaygroundShell } from "@/components/playground/PlaygroundShell";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <PlaygroundShell />
    </Suspense>
  );
}
