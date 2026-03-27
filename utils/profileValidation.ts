/**
 * Profile Validation Utility
 * Validates CharacterProfile completeness to prevent character drift.
 * Task 5.1.1 from V2 Batch Plan
 */

import { CharacterProfile } from '../types';

/**
 * Quality assessment result for a CharacterProfile
 */
export interface ProfileQuality {
  /** Overall quality score from 0-100 */
  score: number;
  /** List of fields that are missing or empty */
  missingFields: string[];
  /** Warning messages for critical missing fields */
  warnings: string[];
  /** Whether the profile is usable (score >= 40) */
  isUsable: boolean;
}

/**
 * Field configuration for validation
 */
interface FieldConfig {
  /** Path to access the field (dot notation for nested) */
  path: string;
  /** Display name for the field in messages */
  displayName: string;
  /** Weight for scoring (higher = more important) */
  weight: number;
  /** Warning message if this critical field is missing */
  criticalWarning?: string;
}

/**
 * Fields to validate with their configurations
 */
const VALIDATION_FIELDS: FieldConfig[] = [
  {
    path: 'identityHeader.face',
    displayName: 'Face description (identityHeader)',
    weight: 15,
    criticalWarning: 'No face description - character may look different each page'
  },
  {
    path: 'identityHeader.eyes',
    displayName: 'Eyes description (identityHeader)',
    weight: 10
  },
  {
    path: 'identityHeader.hair',
    displayName: 'Hair description (identityHeader)',
    weight: 12,
    criticalWarning: 'No hair description - hairstyle may drift'
  },
  {
    path: 'identityHeader.skin',
    displayName: 'Skin description (identityHeader)',
    weight: 10
  },
  {
    path: 'identityHeader.build',
    displayName: 'Build description (identityHeader)',
    weight: 8
  },
  {
    path: 'faceDescription',
    displayName: 'Face description',
    weight: 15,
    criticalWarning: 'No face description - character may look different each page'
  },
  {
    path: 'bodyType',
    displayName: 'Body type',
    weight: 8
  },
  {
    path: 'clothing',
    displayName: 'Clothing description',
    weight: 10
  },
  {
    path: 'hardNegatives',
    displayName: 'Hard negatives list',
    weight: 12,
    criticalWarning: 'No hard negatives - AI may add unwanted features'
  }
];

/**
 * Safely get a nested property value from an object
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Check if a field value is considered "filled"
 */
function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  // For arrays (like hardNegatives), check length
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // For strings, check if non-empty after trimming
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  // For other types (objects, numbers, etc.), consider filled
  return true;
}

/**
 * Validates the completeness of a CharacterProfile
 *
 * @param profile - The CharacterProfile to validate
 * @returns ProfileQuality assessment with score, missing fields, warnings, and usability status
 */
export function validateProfileCompleteness(profile: CharacterProfile): ProfileQuality {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const warningsAdded = new Set<string>(); // Track unique warnings

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const field of VALIDATION_FIELDS) {
    totalWeight += field.weight;

    const value = getNestedValue(profile as unknown as Record<string, unknown>, field.path);
    const isFilled = isFieldFilled(value);

    if (isFilled) {
      earnedWeight += field.weight;
    } else {
      missingFields.push(field.displayName);

      // Add critical warning if applicable and not already added
      if (field.criticalWarning && !warningsAdded.has(field.criticalWarning)) {
        warnings.push(field.criticalWarning);
        warningsAdded.add(field.criticalWarning);
      }
    }
  }

  // Calculate score as percentage
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    score,
    missingFields,
    warnings,
    isUsable: score >= 40
  };
}
