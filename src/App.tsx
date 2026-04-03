import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import type { Note, ColumnId } from './types';
import Column from './components/Column';
import TaskModal from './components/TaskModal';
import SortableTask from './components/SortableTask';
import LoginPage from './components/LoginPage';
import ConfirmDialog from './components/ConfirmDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009/api/v1';

const COLUMNS: { id: ColumnId; title: string; colorVar: string }[] = [
  { id: 'todo', title: 'To Do', colorVar: '--accent-todo' },
  { id: 'inprogress', title: 'In Progress', colorVar: '--accent-inprogress' },
  { id: 'done', title: 'Done', colorVar: '--accent-done' },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('user_session'));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('user_session'));
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeDefaultColumn, setActiveDefaultColumn] = useState<ColumnId>('todo');

  // Confirmation state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ id: number, nextStatus: ColumnId, nextName?: string } | null>(null);
  const [startStatus, setStartStatus] = useState<ColumnId | null>(null);

  const getNotesData = useCallback(async () => {
    const token = authToken || localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
    return null;
  }, [authToken]);

  const fetchNotes = useCallback(async () => {
    const data = await getNotesData();
    if (data) {
      setNotes(Array.isArray(data) ? data : data.data || []);
    }
  }, [getNotesData]);

  useEffect(() => {
    let ignore = false;

    if (isLoggedIn && authToken) {
      getNotesData().then(data => {
        if (!ignore && data) {
          setNotes(Array.isArray(data) ? data : data.data || []);
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, authToken, getNotesData]);

  const handleLogin = (email: string, token: string) => {
    localStorage.setItem('user_session', email);
    localStorage.setItem('auth_token', token);
    setIsLoggedIn(true);
    setUserEmail(email);
    setAuthToken(token);
    // No need for setTimeout/fetchNotes here, the useEffect will trigger automatically
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    setUserEmail(null);
    setAuthToken(null);
    setNotes([]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    setActiveId(activeId);
    
    const activeItem = notes.find(n => n.id === activeId);
    if (activeItem) {
      setStartStatus(activeItem.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overIdRaw = over.id;

    if (active.id === overIdRaw) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Task over Task
    if (isActiveTask && isOverTask) {
      setNotes((notes) => {
        const activeIndex = notes.findIndex((t) => t.id === activeId);
        const overIndex = notes.findIndex((t) => t.id === Number(overIdRaw));

        if (notes[activeIndex].status !== notes[overIndex].status) {
          const newNotes = [...notes];
          newNotes[activeIndex] = {
            ...newNotes[activeIndex],
            status: notes[overIndex].status,
            date_updated: new Date().toISOString()
          };
          return arrayMove(newNotes, activeIndex, overIndex);
        }

        return arrayMove(notes, activeIndex, overIndex);
      });
    }

    // Task over Column
    if (isActiveTask && isOverColumn) {
      setNotes((notes) => {
        const activeIndex = notes.findIndex((t) => t.id === activeId);
        const overColumnId = overIdRaw as ColumnId;

        if (notes[activeIndex].status !== overColumnId) {
          const newNotes = [...notes];
          newNotes[activeIndex] = {
            ...newNotes[activeIndex],
            status: overColumnId,
            date_updated: new Date().toISOString()
          };
          return newNotes;
        }

        return notes;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      setStartStatus(null);
      return;
    }

    const activeIdNum = Number(active.id);
    const overIdRaw = over.id;

    if (active.data.current?.type === 'Task') {
      const activeItem = notes.find((t) => t.id === activeIdNum);
      if (activeItem && startStatus) {
        const newStatus = activeItem.status;

        if (newStatus !== startStatus) {
          setPendingUpdate({ id: activeIdNum, nextStatus: newStatus, nextName: activeItem.name });
          setShowConfirmUpdate(true);
        }
      }
      setStartStatus(null);

      // array moves
      if (active.id !== overIdRaw) {
        setNotes((notes) => {
          const activeIndex = notes.findIndex((t) => t.id === activeIdNum);
          const overIndex = notes.findIndex((t) => t.id === Number(overIdRaw));

          if (overIndex >= 0) {
            return arrayMove(notes, activeIndex, overIndex);
          }
          return notes;
        });
      }
    }
  };

  const activeTask = activeId ? notes.find((t) => t.id === activeId) : null;

  const handleAddNote = (columnId: ColumnId) => {
    setEditingNote(null);
    setActiveDefaultColumn(columnId);
    setShowModal(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleDeleteNote = (id: number) => {
    setNoteToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${noteToDelete}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== noteToDelete));
      }
    } catch (err) {
      console.error('Failed to delete note', err);
    }
    setShowConfirmDelete(false);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingUpdate) return;
    const { id, nextStatus, nextName } = pendingUpdate;
    const note = notes.find(n => n.id === id);
    if (!note) return;

    try {
      await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: nextName || note.name,
          status: nextStatus,
          date_updated: new Date().toISOString()
        })
      });
      setNotes((prev) => prev.map(n => n.id === id ? { 
        ...n, 
        status: nextStatus, 
        name: nextName || n.name,
        date_updated: new Date().toISOString() 
      } : n));
      fetchNotes(); 
    } catch (err) {
      console.error('Failed to update status', err);
      fetchNotes(); 
    }
    setShowConfirmUpdate(false);
  };

  const performNoteUpdate = async (id: number, name: string, status: ColumnId) => {
    try {
      await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: name,
          status: status,
          date_updated: new Date().toISOString()
        })
      });
      setNotes((prev) => prev.map(n => n.id === id ? { 
        ...n, 
        status: status, 
        name: name,
        date_updated: new Date().toISOString() 
      } : n));
      fetchNotes(); 
    } catch (err) {
      console.error('Failed to update note', err);
      fetchNotes(); 
    }
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (editingNote) {
      const nextStatus = noteData.status as ColumnId;
      const nextName = noteData.name || editingNote.name;

      if (editingNote.status !== nextStatus) {
        setPendingUpdate({ 
          id: editingNote.id, 
          nextStatus: nextStatus, 
          nextName: nextName 
        });
        setShowConfirmUpdate(true);
      } else {
        // Status remains the same, just update name immediately
        await performNoteUpdate(editingNote.id, nextName, editingNote.status);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/notes`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: noteData.name,
            status: noteData.status,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString()
          })
        });
        if (res.ok) {
          fetchNotes();
        }
      } catch (err) { console.error(err); }
    }
    setShowModal(false);
  };

  const handleAddSubtask = async (noteId: number, title: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/subtasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ note_id: noteId, title })
      });
      if (res.ok) {
        // Refresh notes to get updated subtasks list
        const updated = await res.json();
        // Optimistically update the editingNote if it's the one we're adding to
        if (editingNote && editingNote.id === noteId) {
          setEditingNote(prev => prev ? {
            ...prev,
            subtasks: [...(prev.subtasks || []), updated.data]
          } : null);
        }
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to add subtask', err);
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/subtasks/${subtaskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        // Update local state for immediate feedback
        if (editingNote) {
          setEditingNote(prev => prev ? {
            ...prev,
            subtasks: prev.subtasks?.map(s => s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s)
          } : null);
        }
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        // Update local state for immediate feedback
        if (editingNote) {
          setEditingNote(prev => prev ? {
            ...prev,
            subtasks: prev.subtasks?.filter(s => s.id !== subtaskId)
          } : null);
        }
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to delete subtask', err);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} apiUrl={API_BASE_URL} />;
  }

  return (
    <div className="kanban-container">
      <header className="kanban-header">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <i className="bi bi-kanban" style={{ fontSize: '1.2rem' }}></i>
          </div>
          <div className="d-flex flex-column">
            <h1 className="h4 mb-0">Todo List</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userEmail}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn-primary-custom px-3 py-2" onClick={() => handleAddNote('todo')}>
            <i className="bi bi-plus-lg"></i> Create Note
          </button>
          <button className="btn-icon" onClick={handleLogout} title="Logout" style={{ height: 'auto', padding: '0.5rem 0.75rem' }}>
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </header>

      <main className="kanban-board">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              colorVar={col.colorVar}
              notes={notes.filter((n) => n.status === col.id)}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          ))}

          <DragOverlay>
            {activeTask && (
              <SortableTask
                note={activeTask}
                onEdit={() => { }}
                onDelete={() => { }}
              />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      <TaskModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSaveNote}
        onAddSubtask={handleAddSubtask}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        note={editingNote}
        defaultColumnId={activeDefaultColumn}
      />
      <ConfirmDialog
        show={showConfirmDelete}
        title="Delete Note?"
        message="This action cannot be undone. Are you sure you want to delete this note?"
        variant="danger"
        onHide={() => setShowConfirmDelete(false)}
        onConfirm={confirmDeleteNote}
      />

      <ConfirmDialog
        show={showConfirmUpdate}
        title="Update Status?"
        message={`Move task to "${COLUMNS.find(c => c.id === pendingUpdate?.nextStatus)?.title}" column?`}
        onHide={() => {
          setShowConfirmUpdate(false);
          fetchNotes(); 
        }}
        onConfirm={confirmStatusUpdate}
      />
    </div>
  );
}

export default App;
