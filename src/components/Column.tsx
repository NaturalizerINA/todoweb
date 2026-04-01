
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ColumnId, Note } from '../types';
import SortableTask from './SortableTask';

interface ColumnProps {
  id: ColumnId;
  title: string;
  notes: Note[];
  colorVar: string;
  onAdd: (columnId: ColumnId) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}

const Column = ({ 
  id, 
  title, 
  notes, 
  colorVar, 
  onAdd, 
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

      <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        <button 
          className="btn-icon w-100" 
          onClick={() => onAdd(id)}
          style={{ width: '100%', borderRadius: '8px', padding: '0.75rem', height: 'auto', backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <i className="bi bi-plus-lg me-2"></i> Add Note
        </button>
      </div>
    </div>
  );
};

export default Column;
