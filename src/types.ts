export type ColumnId = 'todo' | 'inprogress' | 'done';

export interface Subtask {
  id: number;
  note_id: number;
  title: string;
  is_completed: boolean;
  date_created?: string;
  date_updated?: string;
}

export interface Note {
  id: number;
  name: string;
  status: ColumnId;
  date_created?: string;
  date_updated?: string;
  subtasks?: Subtask[];
}

export interface BoardData {
  tasks: Note[];
}
