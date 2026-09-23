export type Gender = 'MALE' | 'FEMALE';
export type UserRole = 'MEMBER' | 'ADMIN';

export interface CurrentUser {
  id: string;
  name: string;
  gender: Gender;
  role: UserRole;
}

export interface ExerciseItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  equipment: string;
  difficulty: string;
  defaultSets: number;
  defaultReps: number;
  defaultRest: number;
  imageUrl: string | null;
  isPrimary?: boolean;
}

export interface MuscleGroupItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  order: number;
}

export interface RoutineExerciseItem {
  id?: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  notes?: string | null;
  exercise?: ExerciseItem;
}

export interface RoutineDetail {
  id: string;
  name: string;
  description: string | null;
  isTemplate: boolean;
  targetGender: string | null;
  exercises: RoutineExerciseItem[];
}
