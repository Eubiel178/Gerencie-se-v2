export interface ITaskStep {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
}
