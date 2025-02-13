import { JobPreferences } from '../types/resume';

/**
 * Calculate match percentage between job keywords and user preferences
 * Uses the same formula as the find-matching-jobs function:
 * - Keyword matches (30%)
 * - Level match (15%)
 * - Role match (15%)
 * - Base score (40%) - this would normally be from OpenAI but we'll use it as a base match
 */
export function calculateMatchPercentage(
  jobKeywords: string[],
  jobPosition: string,
  preferences: JobPreferences
): number {
  // Calculate keyword matches (30%)
  const keywordMatches = jobKeywords.filter(keyword => 
    preferences.skills?.some(skill => 
      skill.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(skill.toLowerCase())
    )
  ).length;
  const skillScore = (keywordMatches / Math.max(jobKeywords.length, 1)) * 0.3;

  // Calculate level match (15%)
  const levelScore = preferences.level?.some(level => 
    jobPosition.toLowerCase().includes(level.toLowerCase())
  ) ? 0.15 : 0;

  // Calculate role match (15%)
  const roleScore = preferences.roles?.some(role =>
    jobPosition.toLowerCase().includes(role.toLowerCase())
  ) ? 0.15 : 0;

  // Base score (40%) - this would normally come from OpenAI
  const baseScore = 0.4;

  // Calculate total score and convert to percentage
  const totalScore = Math.round((baseScore + skillScore + levelScore + roleScore) * 100);

  // Ensure score is between 0 and 100
  return Math.min(Math.max(totalScore, 0), 100);
}
