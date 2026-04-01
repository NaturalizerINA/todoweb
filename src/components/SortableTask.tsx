import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Note } from '../types';

interface SortableTaskProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}

const SortableTask = ({ note, onEdit, onDelete }: SortableTaskProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, data: { type: 'Task', note } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-header">
        <h3 className="task-title">{note.name}</h3>
      </div>
      
      <div className="task-footer mt-2">
        <div className="task-actions" onPointerDown={(e) => e.stopPropagation()}>
          <button 
            className="btn-icon" 
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            title="Edit note"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button 
            className="btn-icon delete" 
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            title="Delete note"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortableTask;
