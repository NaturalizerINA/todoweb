import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import type { Note, ColumnId } from '../types';

interface TaskModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (note: Partial<Note>) => void;
  onAddSubtask?: (noteId: number, title: string) => void;
  onToggleSubtask?: (subtaskId: number) => void;
  onDeleteSubtask?: (subtaskId: number) => void;
  note?: Note | null;
  defaultColumnId?: ColumnId;
}

const TaskModal = ({ 
  show, 
  onHide, 
  onSave, 
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  note, 
  defaultColumnId = 'todo' 
}: TaskModalProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ColumnId>('todo');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (note) {
      setName(note.name);
      setStatus(note.status);
    } else {
      setName('');
      setStatus(defaultColumnId);
    }
    setNewSubtask('');
  }, [note, show, defaultColumnId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      status,
    });
    
    if (!note) {
      setName('');
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !note || !onAddSubtask) return;
    onAddSubtask(note.id, newSubtask);
    setNewSubtask('');
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title>{note ? 'Edit Task' : 'Create New Task'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="row">
            <div className={note ? "col-md-7 border-end" : "col-12"}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label">Task Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="What needs to be done?"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="form-label">Column</Form.Label>
                <Form.Select 
                  value={status} 
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as ColumnId)}
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </Form.Select>
              </Form.Group>
            </div>

            {note && (
              <div className="col-md-5">
                <Form.Label className="form-label">Subtasks</Form.Label>
                <div className="subtask-list mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {note.subtasks && note.subtasks.length > 0 ? (
                    note.subtasks.map(sh => (
                      <div key={sh.id} className="d-flex align-items-center mb-2 gap-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <Form.Check 
                          type="checkbox" 
                          checked={sh.is_completed}
                          onChange={() => onToggleSubtask?.(sh.id)}
                        />
                        <span style={{ 
                          fontSize: '0.9rem', 
                          textDecoration: sh.is_completed ? 'line-through' : 'none',
                          color: sh.is_completed ? 'var(--text-muted)' : 'var(--text-main)',
                          flex: 1
                        }}>
                          {sh.title}
                        </span>
                        <button 
                          type="button"
                          className="btn-icon delete ms-auto" 
                          onClick={() => onDeleteSubtask?.(sh.id)}
                          title="Delete subtask"
                        >
                          <i className="bi bi-trash" style={{ fontSize: '0.85rem' }}></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small">No subtasks yet.</p>
                  )}
                </div>
                <InputGroup size="sm">
                  <Form.Control
                    placeholder="Add subtask..."
                    value={newSubtask}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  />
                  <Button type="button" variant="outline-primary" onClick={handleAddSubtask}>
                    <i className="bi bi-plus"></i>
                  </Button>
                </InputGroup>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="link" onClick={onHide} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary-custom" disabled={!name.trim()}>
            {note ? 'Save Changes' : 'Create Task'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TaskModal;
