import { Eye, FamilyMember } from '../types';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { formatLocalDate } from './utils';

/**
 * Calculates which eye should be patched on a given date for a family member.
 */
export function getEyeForDate(date: Date, member: FamilyMember): Eye {
  const start = startOfDay(parseISO(member.startDate));
  const target = startOfDay(date);
  
  const diffDays = differenceInCalendarDays(target, start);
  if (diffDays < 0) {
    return 'none';
  }
  
  const cycleIndex = diffDays % member.cycleLength;
  return member.cyclePattern[cycleIndex] || 'none';
}

/**
 * Gets the human-friendly cycle day number (e.g. 1st Day, 2nd Day...)
 */
export function getCycleDayIndex(date: Date, member: FamilyMember): { indexInCycle: number; totalInPattern: number } {
  const start = startOfDay(parseISO(member.startDate));
  const target = startOfDay(date);
  
  const diffDays = differenceInCalendarDays(target, start);
  if (diffDays < 0) {
    return { indexInCycle: 0, totalInPattern: 0 };
  }
  
  const indexInCycle = diffDays % member.cycleLength;
  const currentEye = member.cyclePattern[indexInCycle];
  
  // Count how many times this eye appears in the cycle, and which index of that eye this day is.
  let targetEyeOccurrenceCount = 0;
  let targetEyeOccurrenceIndex = 0;
  
  for (let i = 0; i < member.cycleLength; i++) {
    if (member.cyclePattern[i] === currentEye) {
      targetEyeOccurrenceCount++;
      if (i <= indexInCycle) {
        targetEyeOccurrenceIndex++;
      }
    }
  }
  
  return {
    indexInCycle: targetEyeOccurrenceIndex,
    totalInPattern: targetEyeOccurrenceCount
  };
}

/**
 * Computes the consecutive daily streak of completed patching logs.
 */
export function getStreak(member: FamilyMember): number {
  let streak = 0;
  const today = startOfDay(new Date());
  let checkDate = today;
  
  while (true) {
    const dateStr = formatLocalDate(checkDate);
    const session = member.completedDates[dateStr];
    
    if (session && session.completed) {
      streak++;
      // check the previous day
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      // If today is not completed yet, check if yesterday was completed to maintain the streak
      if (checkDate.getTime() === today.getTime()) {
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        continue;
      }
      break;
    }
  }
  
  return streak;
}

/**
 * Calculates the member's current age dynamically if birthDate is set.
 * Falls back to the static age string if birthDate is not available.
 */
export function getMemberAge(member: FamilyMember): string {
  if (member.birthDate) {
    const birth = new Date(member.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return String(Math.max(0, age));
  }
  return member.age;
}
