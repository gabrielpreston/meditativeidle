/**
 * Type definitions for the Developer Panel setting system.
 * Provides type-safe setting definitions for all configurable game values.
 */

export type SettingType = 'number' | 'boolean';

export interface BaseSettingDefinition {
  key: string;
  label: string;
  category: string;
  description?: string;
  type: SettingType;
}

export interface NumberSettingDefinition extends BaseSettingDefinition {
  type: 'number';
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string; // e.g., 'px', 's', '%'
}

export interface BooleanSettingDefinition extends BaseSettingDefinition {
  type: 'boolean';
  value: boolean;
}

export type SettingDefinition = NumberSettingDefinition | BooleanSettingDefinition;

export interface SettingCategory {
  id: string;
  label: string;
  collapsed: boolean;
  settings: SettingDefinition[];
}

