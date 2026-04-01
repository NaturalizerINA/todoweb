import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import type { Note, ColumnId } from '../types';

interface TaskModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (note: Partial<Note>) => void;
  note?: Note | null;
  defaultColumnId?: ColumnId;
}

const TaskModal = ({ show, onHide, onSave, note, defaultColumnId = 'todo' }: TaskModalProps) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ColumnId>('todo');

  useEffect(() => {
    if (note) {
      setName(note.name);
      setStatus(note.status);
    } else {
      setName('');
      setStatus(defaultColumnId);
    }
  }, [note, show, defaultColumnId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      status,
    });
    
    // Reset form after saving new note
    if (!note) {
      setName('');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title>{note ? 'Edit Note' : 'Create New Note'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
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
            <Form.Label>Status</Form.Label>
            <Form.Select 
              value={status} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as ColumnId)}
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: 'none' }}>
            Cancel
          </Button>
          <Button type="submit" className="btn-primary-custom" disabled={!name.trim()}>
            {note ? 'Save Changes' : 'Create Note'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TaskModal;
