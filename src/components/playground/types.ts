import React from 'react';

export type PropControlValue = string | number | boolean;

export interface PropControlConfig {
  name: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  defaultValue: PropControlValue;
  options?: string[];
  description?: string;
}

export interface RegisteredComponent {
  id: string;
  name: string;
  category: 'Actions' | 'Layout' | 'Inputs' | 'Data Display' | 'Feedback' | 'Navigation';
  description: string;
  controls: PropControlConfig[];
  render: (props: Record<string, PropControlValue>) => React.ReactNode;
  generateCode: (props: Record<string, PropControlValue>) => string;
  sourceCode?: string;
  scssCode?: string;
}
