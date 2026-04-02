
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnId, Note } from '../types';
import SortableTask from './SortableTask';

interface ColumnProps {
  id: ColumnId;
  title: string;
  notes: Note[];
  colorVar: string;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}

const Column = ({
  id,
  title,
  notes,
  colorVar,
  onEdit,
  onDelete
}: ColumnProps) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'Column',
      columnId: id,
    },
  });

  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: `var(${colorVar})` }} />
          <span>{title}</span>
        </div>
        <span className="badge">{notes.length}</span>
      </div>

      <div className="column-body" ref={setNodeRef}>
        <SortableContext
          items={notes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {notes.map((note) => (
            <SortableTask
              key={note.id}
              note={note}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default Column;
