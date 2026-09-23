export interface StepLike {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface StepsDraft<T extends StepLike> {
  existingSteps: T[];
  newStepTitles: string[];
}
