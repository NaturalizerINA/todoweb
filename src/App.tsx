import { useState, useEffect } from 'react';
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009/api/v1';

const COLUMNS: { id: ColumnId; title: string; colorVar: string }[] = [
  { id: 'todo', title: 'To Do', colorVar: '--accent-todo' },
  { id: 'inprogress', title: 'In Progress', colorVar: '--accent-inprogress' },
  { id: 'done', title: 'Done', colorVar: '--accent-done' },
];

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeDefaultColumn, setActiveDefaultColumn] = useState<ColumnId>('todo');

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

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
    setActiveId(Number(event.active.id));
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
    if (!over) return;

    const activeIdNum = Number(active.id);
    const overIdRaw = over.id;

    // We already optimistically updated the status in handleDragOver if needed
    // However, we want to hit the API with the new status of this card if it changed
    if (active.data.current?.type === 'Task') {
      const activeItem = notes.find((t) => t.id === activeIdNum);
      if (activeItem) {
        // Find what standard column we settled in
        const newStatus = activeItem.status;
        const oldStatus = active.data.current?.note.status;

        // If status actually changed or position changed, we can update in backend
        if (newStatus !== oldStatus) {
          try {
            await fetch(`${API_BASE_URL}/notes/${activeIdNum}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: activeItem.name, status: newStatus })
            });
          } catch (err) {
            console.error('Failed to update note status', err);
            // Optimally we'd revert the state here, but re-fetching works as a fallback
            fetchNotes();
          }
        }
      }

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

  const handleDeleteNote = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const handleSaveNote = async (noteData: Partial<Note>) => {
    if (editingNote) {
      try {
        const res = await fetch(`${API_BASE_URL}/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: noteData.name, status: noteData.status })
        });
        if (res.ok) {
          fetchNotes();
        }
      } catch (err) { console.error(err); }
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: noteData.name, status: noteData.status })
        });
        if (res.ok) {
          fetchNotes();
        }
      } catch (err) { console.error(err); }
    }
    setShowModal(false);
  };

  return (
    <div className="kanban-container">
      <header className="kanban-header">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <i className="bi bi-kanban" style={{ fontSize: '1.2rem' }}></i>
          </div>
          <h1>Todo List</h1>
        </div>
        <button className="btn-primary-custom px-3 py-2" onClick={() => handleAddNote('todo')}>
          <i className="bi bi-plus-lg"></i> Create Note
        </button>
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
              onAdd={handleAddNote}
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
        note={editingNote}
        defaultColumnId={activeDefaultColumn}
      />
    </div>
  );
}

export default App;
