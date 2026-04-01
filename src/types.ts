export type ColumnId = 'todo' | 'inprogress' | 'done';

export interface Note {
  id: number;
  name: string;
  status: ColumnId;
}

export interface BoardData {
  tasks: Note[];
}
