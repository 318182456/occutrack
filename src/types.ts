export type Eye = 'left' | 'right' | 'none';

export interface PatchSession {
  completed: boolean;
  hours: number;
  remarks: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  age: string;
  birthDate?: string;
  avatar: string;
  cycleLength: number;
  cyclePattern: Eye[];
  startDate: string; // YYYY-MM-DD
  completedDates: { [dateStr: string]: PatchSession };
  targetHours: number; // e.g. 6 hours as shown in screen
}

