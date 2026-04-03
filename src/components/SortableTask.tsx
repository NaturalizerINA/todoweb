import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Note } from '../types';

export interface SortableTaskProps {
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
      <div className="task-header mb-1">
        <h3 className="task-title">{note.name}</h3>
      </div>

      {note.subtasks && note.subtasks.length > 0 && (
        <div className="subtask-progress mt-2 mb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <i className="bi bi-list-check me-1"></i>
              {note.subtasks.filter(s => s.is_completed).length}/{note.subtasks.length} Subtasks
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {Math.round((note.subtasks.filter(s => s.is_completed).length / note.subtasks.length) * 100)}%
            </span>
          </div>
          <div className="progress" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <div 
              className="progress-bar bg-success" 
              role="progressbar" 
              style={{ width: `${(note.subtasks.filter(s => s.is_completed).length / note.subtasks.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="task-footer mt-2 d-flex justify-content-between align-items-center w-100">
        <div className="task-date w-100 d-flex justify-content-between align-items-center">
          <div className="d-flex flex-column gap-1" style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
            {note.date_created && (
              <div>
                <i className="bi bi-calendar-plus me-1"></i>
                {new Date(note.date_created).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
            {note.date_updated && (
              <div>
                <i className="bi bi-pencil-square me-1"></i>
                {new Date(note.date_updated).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
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
    </div>
  );
};

export default SortableTask;
