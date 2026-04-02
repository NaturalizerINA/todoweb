export type ColumnId = 'todo' | 'inprogress' | 'done';

export interface Note {
  id: number;
  name: string;
  status: ColumnId;
  date_created?: string;
  date_updated?: string;
}

export interface BoardData {
  tasks: Note[];
}
