// src/lib/data/index.ts - Barrel exports for data modules
// Re-exports from original data.ts for backward compatibility
// New code should import from specific modules

export * from './groups';
export * from './matches';

// Re-export everything from original data.ts to maintain backward compatibility
// This will be gradually migrated to specific modules
export * from '../data';
