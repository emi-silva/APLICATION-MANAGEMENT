import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createSocket } from './socket';

function StatusPill({ status }) {
  const cls = status === 'done' ? 'status-done' : status === 'doing' ? 'status-doing' : 'status-todo';
  const label = status === 'done' ? 'Hecha' : status === 'doing' ? 'En progreso' : 'Por hacer';
  return <span className={`pill ${cls}`}>{label}</span>;
}

function Presence({ list }) {
  return (
    <div className="presence">
      {list.map(p => (
        <span key={p.id} className="presence-item">
          <span className="dot" style={{ background: p.color }} /> {p.name}
        </span>
      ))}
    </div>
  );
}

function TaskItem({ task, onUpdate, onDelete }) {
  return (
    <div className="task">
      <header>
        <strong>{task.title}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={task.status} onChange={(e) => onUpdate({ status: e.target.value })}>
            <option value="todo">Por hacer</option>
            <option value="doing">En progreso</option>
            <option value="done">Hecha</option>
          </select>
          <button className="secondary" onClick={onDelete}>Eliminar</button>
        </div>
      </header>
      {task.description && <p style={{ marginTop: 6 }}>{task.description}</p>}
      <div style={{ marginTop: 6 }}>
        <StatusPill status={task.status} />
      </div>
    </div>
  );
}

function TaskForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <h3>Nueva tarea</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Descripción" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <button onClick={() => {
            if (!title.trim()) return;
            onCreate({ title, description });
            setTitle('');
            setDescription('');
          }}>Crear</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [workspaceId, setWorkspaceId] = useState('demo');
  const [secret, setSecret] = useState('demo');
  const [name, setName] = useState('Usuario');
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState([]);
  const [tasks, setTasks] = useState([]);

  const socket = useMemo(() => createSocket(), []);
  const joined = useRef(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      if (!joined.current) {
        socket.emit('room:join', { workspaceId, secret, user: { name, color: '#4f46e5' } });
        joined.current = true;
      }
    }
    function onDisconnect() {
      setConnected(false);
      joined.current = false;
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('room:error', (err) => {
      alert(err?.error || 'Error de acceso al workspace');
    });
    socket.on('presence:update', (list) => setPresence(list));
    socket.on('tasks:sync', (list) => setTasks(list));
    socket.on('tasks:created', (task) => setTasks(prev => [task, ...prev]));
    socket.on('tasks:updated', (task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)));
    socket.on('tasks:deleted', (task) => setTasks(prev => prev.filter(t => t.id !== task.id)));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:error');
      socket.off('presence:update');
      socket.off('tasks:sync');
      socket.off('tasks:created');
      socket.off('tasks:updated');
      socket.off('tasks:deleted');
    };
  }, [socket, workspaceId, name]);

  function connect() {
    if (socket.connected) return;
    socket.connect();
  }
  function disconnect() {
    if (!socket.connected) return;
    socket.disconnect();
  }

  function createTask(payload) {
    socket.emit('task:create', { workspaceId, task: payload });
  }
  function updateTask(id, updates) {
    socket.emit('task:update', { workspaceId, id, updates });
  }
  function deleteTask(id) {
    socket.emit('task:delete', { workspaceId, id });
  }

  return (
    <div className="container">
      <h1>Task Management App</h1>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row">
          <div>
            <h3>Workspace</h3>
            <input placeholder="workspace" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
            <h3 style={{ marginTop: 12 }}>Clave del workspace</h3>
            <input placeholder="clave" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
            <div style={{ marginTop: 8 }}>
              <button className="secondary" onClick={async () => {
                if (!workspaceId || !secret) return alert('Escribe nombre y clave');
                try {
                  const res = await fetch(`http://localhost:4000/api/workspaces`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: workspaceId, secret }),
                  });
                  if (res.ok) {
                    alert('Workspace creado');
                  } else {
                    const data = await res.json();
                    alert(data.error || 'No se pudo crear');
                  }
                } catch (e) {
                  alert('Error creando workspace');
                }
              }}>Crear workspace</button>
            </div>
            <h3 style={{ marginTop: 12 }}>Tu nombre</h3>
            <input placeholder="tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {!connected ? (
                <button onClick={connect}>Conectar</button>
              ) : (
                <button className="secondary" onClick={disconnect}>Desconectar</button>
              )}
            </div>
            <h3 style={{ marginTop: 12 }}>Presencia</h3>
            <Presence list={presence} />
          </div>
          <div>
            <h3>Tareas</h3>
            <div className="tasks">
              {tasks.map(task => (
                <TaskItem key={task.id} task={task} onUpdate={(u) => updateTask(task.id, u)} onDelete={() => deleteTask(task.id)} />
              ))}
            </div>
            <TaskForm onCreate={createTask} />
          </div>
        </div>
      </div>
      <p style={{ opacity: 0.7 }}>Tip: comparte el mismo workspace (ej. "demo") entre varias pestañas para ver la colaboración en tiempo real.</p>
    </div>
  );
}
