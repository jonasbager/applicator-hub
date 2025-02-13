import { JobPreferences } from '../types/resume';

/**
 * Calculate match percentage between job keywords and user preferences
 * Uses a more generous scoring system:
 * - Base score (60%) - higher base to encourage users
 * - Keyword matches (20%) - partial matching allowed
 * - Level/Role match (20%) - partial matching allowed
 */
export function calculateMatchPercentage(
  jobKeywords: string[],
  jobPosition: string,
  preferences: JobPreferences
): number {
  // Calculate keyword matches (20%)
  const keywordMatches = jobKeywords.filter(keyword => 
    preferences.skills?.some(skill => {
      const k = keyword.toLowerCase();
      const s = skill.toLowerCase();
      // Check for partial matches too
      return k.includes(s) || s.includes(k) || 
             // Handle common variations
             k.replace('-', '').includes(s) || s.replace('-', '').includes(k) ||
             k.replace(' ', '').includes(s) || s.replace(' ', '').includes(k);
    })
  ).length;
  
  // More generous skill scoring - if we have any matches, minimum 10%
  const skillScore = keywordMatches > 0 
    ? Math.max(0.1, (keywordMatches / Math.max(jobKeywords.length, 1)) * 0.2)
    : 0;

  // Calculate level/role match (20% combined)
  // Use partial matching for both level and role
  const positionLower = jobPosition.toLowerCase();
  
  // Level matching (10%) - partial matches get partial credit
  const levelScore = preferences.level?.reduce((score, level) => {
    const levelLower = level.toLowerCase();
    if (positionLower.includes(levelLower)) return 0.1;  // Full match
    // Check for related terms
    if (levelLower.includes('senior') && positionLower.includes('sr')) return 0.1;
    if (levelLower.includes('junior') && positionLower.includes('jr')) return 0.1;
    // Partial match
    const words = levelLower.split(' ');
    const partialMatches = words.filter(word => positionLower.includes(word));
    return Math.max(score, (partialMatches.length / words.length) * 0.1);
  }, 0) || 0;

  // Role matching (10%) - partial matches get partial credit
  const roleScore = preferences.roles?.reduce((score, role) => {
    const roleLower = role.toLowerCase();
    if (positionLower.includes(roleLower)) return 0.1;  // Full match
    // Check for common role variations
    if (roleLower.includes('product') && positionLower.includes('pm')) return 0.1;
    if (roleLower.includes('engineer') && positionLower.includes('dev')) return 0.1;
    // Partial match
    const words = roleLower.split(' ');
    const partialMatches = words.filter(word => positionLower.includes(word));
    return Math.max(score, (partialMatches.length / words.length) * 0.1);
  }, 0) || 0;

  // Higher base score (60%) to encourage users
  const baseScore = 0.6;

  // Calculate total score and convert to percentage
  const totalScore = Math.round((baseScore + skillScore + levelScore + roleScore) * 100);

  // Ensure score is between 0 and 100
  return Math.min(Math.max(totalScore, 0), 100);
}
