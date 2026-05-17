import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const statusBadge = {
  TODO: <span className="badge-todo">To Do</span>,
  IN_PROGRESS: <span className="badge-in-progress">In Progress</span>,
  DONE: <span className="badge-done">Done</span>,
};

const priorityBadge = {
  LOW: <span className="badge-low">Low</span>,
  MEDIUM: <span className="badge-medium">Medium</span>,
  HIGH: <span className="badge-high">High</span>,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  const stats = data?.stats || {};
  const myTasks = data?.myTasks || [];
  const pendingTasks = myTasks.filter(t => t.status !== 'DONE');
  const overdueTasks = myTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's on your plate today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Tasks', value: stats.totalTasks || 0, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'In Progress', value: stats.IN_PROGRESS || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Overdue', value: stats.overdueTasks || 0, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Projects', value: stats.projectCount || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`card p-5 ${s.bg}`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-red-600">These tasks are past their due date and need attention.</p>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Tasks</h2>
          <Link to="/projects" className="text-sm text-indigo-600 hover:underline">View projects →</Link>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No pending tasks assigned to you.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingTasks.map(task => (
              <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Link to={`/projects/${task.project.id}`} className="text-xs text-indigo-500 hover:underline">
                      {task.project.name}
                    </Link>
                    {task.dueDate && (
                      <span className={`text-xs ${isPast(new Date(task.dueDate)) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        · Due {format(new Date(task.dueDate), 'MMM d')}
                        {isPast(new Date(task.dueDate)) && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {priorityBadge[task.priority]}
                  {statusBadge[task.status]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
