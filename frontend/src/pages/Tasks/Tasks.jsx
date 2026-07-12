import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import './Tasks.css';

// ─── Phases definition ──────────────────────────────────────────────────────
const PHASES = [
  { key: 'DRAFT',      label: 'Draft' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'COMPLETED',  label: 'Completed' },
];

// ─── Mini pipeline bar inside each Kanban card ──────────────────────────────
const MiniPipeline = ({ status }) => {
  const isCancelled = status === 'CANCELLED';
  const order = ['DRAFT', 'DISPATCHED', 'COMPLETED'];
  const currentIdx = order.indexOf(status);

  const getNodeState = (phaseKey) => {
    if (isCancelled) return phaseKey === 'DRAFT' ? 'done' : 'idle';
    const phaseIdx = order.indexOf(phaseKey);
    if (phaseIdx < currentIdx)  return 'done';
    if (phaseIdx === currentIdx) return 'active';
    return 'idle';
  };

  return (
    <div className="pipeline-mini">
      {PHASES.map((phase, i) => {
        const state  = getNodeState(phase.key);
        const isLast = i === PHASES.length - 1;
        const nextState = !isLast ? getNodeState(PHASES[i + 1].key) : 'idle';
        const connDone = nextState === 'done' || nextState === 'active';

        return (
          <React.Fragment key={phase.key}>
            <div className={`pipeline-mini-node ${state}`} title={phase.label} />
            {!isLast && (
              <div className={`pipeline-mini-line${connDone ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
      {/* Cancelled node */}
      <div className={`pipeline-mini-line${isCancelled ? ' done' : ''}`}
        style={{ background: isCancelled ? '#f87171' : undefined }} />
      <div className={`pipeline-mini-node${isCancelled ? ' cancelled' : ''}`} title="Cancelled" />
    </div>
  );
};

// ─── Individual Task Card ─────────────────────────────────────────────────────
const TaskCard = ({ trip, isHighlighted, onAction }) => {
  const [loading, setLoading] = useState({});
  const cardRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  const handleAction = async (actionType) => {
    setLoading(prev => ({ ...prev, [actionType]: true }));
    try {
      await onAction(trip.id, actionType);
    } finally {
      setLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const cardClass = `task-card card-${trip.status.toLowerCase()}${isHighlighted ? ' highlighted' : ''}`;

  return (
    <div ref={cardRef} className={cardClass}>
      <div className="task-tracking">{trip.tracking_number}</div>
      <div className="task-route">
        {trip.source} &rarr; {trip.destination}
      </div>

      <MiniPipeline status={trip.status} />

      <div className="task-assets">
        <div>
          <div style={{ color: '#94a3b8', fontWeight: '600' }}>{trip.vehicle_registration || '—'}</div>
          <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>{trip.vehicle_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#cbd5e1' }}>{trip.driver_name || '—'}</div>
          {trip.revenue && (
            <div className="task-revenue">₹{parseFloat(trip.revenue).toLocaleString('en-IN')}</div>
          )}
        </div>
      </div>

      {/* Status badge row */}
      <div style={{ marginTop: '8px' }}>
        <StatusBadge status={trip.status} />
      </div>

      {/* Inline action buttons */}
      {['DRAFT', 'DISPATCHED'].includes(trip.status) && (
        <div className="task-card-actions">
          {trip.status === 'DRAFT' && (
            <button
              className="btn-task-action dispatch"
              disabled={loading['dispatch_trip']}
              onClick={() => handleAction('dispatch_trip')}
            >
              {loading['dispatch_trip'] ? '...' : '▶ Dispatch'}
            </button>
          )}
          {trip.status === 'DISPATCHED' && (
            <button
              className="btn-task-action complete"
              disabled={loading['complete_trip']}
              onClick={() => handleAction('complete_trip')}
            >
              {loading['complete_trip'] ? '...' : '✓ Complete'}
            </button>
          )}
          <button
            className="btn-task-action cancel"
            disabled={loading['cancel_trip']}
            onClick={() => handleAction('cancel_trip')}
          >
            {loading['cancel_trip'] ? '...' : '✕ Cancel'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Kanban Column ─────────────────────────────────────────────────────────
const KanbanColumn = ({ title, colorClass, trips, highlightId, onAction }) => (
  <div className={`kanban-column ${colorClass}`}>
    <div className={`column-header ${colorClass.replace('col-', '')}`}>
      <span>{title}</span>
      <span className="column-count">{trips.length}</span>
    </div>
    {trips.length === 0 && (
      <div className="column-empty">No trips here</div>
    )}
    {trips.map(trip => (
      <TaskCard
        key={trip.id}
        trip={trip}
        isHighlighted={highlightId === String(trip.id)}
        onAction={onAction}
      />
    ))}
  </div>
);

// ─── Main Tasks Page ──────────────────────────────────────────────────────────
const Tasks = () => {
  const [trips,       setTrips]       = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [searchParams] = useSearchParams();
  const highlightId   = searchParams.get('highlight');

  const fetchTrips = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/trips/');
      setTrips(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch trips for execution board', err);
    }
  }, []);

  // Load on mount + auto-poll every 10 seconds
  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 10000);
    return () => clearInterval(interval);
  }, [fetchTrips]);

  const handleAction = async (tripId, actionType) => {
    try {
      await axios.post(`http://localhost:8000/api/trips/${tripId}/${actionType}/`);
      fetchTrips();
    } catch (err) {
      const msg = err.response?.data?.error;
      alert('Error: ' + (Array.isArray(msg) ? msg.join(', ') : msg || err.message));
    }
  };

  // Partition trips by status
  const draftTrips     = trips.filter(t => t.status === 'DRAFT');
  const activeTrips    = trips.filter(t => t.status === 'DISPATCHED');
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const cancelledTrips = trips.filter(t => t.status === 'CANCELLED');

  const formatTime = (date) =>
    date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h2>
          Execution Board
          <span className="refresh-indicator">
            ● live · last updated {formatTime(lastRefresh)}
          </span>
        </h2>
        <p>Real-time Kanban view of all trip phases. Click a vehicle card in Dispatcher to highlight it here.</p>
      </div>

      <div className="kanban-board">
        <KanbanColumn
          title="Phase 1 — Draft"
          colorClass="col-draft"
          trips={draftTrips}
          highlightId={highlightId}
          onAction={handleAction}
        />
        <KanbanColumn
          title="Phase 2 — Dispatched"
          colorClass="col-dispatched"
          trips={activeTrips}
          highlightId={highlightId}
          onAction={handleAction}
        />
        <KanbanColumn
          title="Phase 3 — Completed"
          colorClass="col-completed"
          trips={completedTrips}
          highlightId={highlightId}
          onAction={handleAction}
        />
        <KanbanColumn
          title="Cancelled"
          colorClass="col-cancelled"
          trips={cancelledTrips}
          highlightId={highlightId}
          onAction={handleAction}
        />
      </div>
    </div>
  );
};

export default Tasks;
