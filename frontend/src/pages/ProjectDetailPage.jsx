import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

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

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/api/projects/${projectId}/members`, { email, role });
      toast.success('Member added!');
      onAdded(res.data.membership);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Add Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="teammate@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get(`/api/projects/${projectId}`)
      .then(res => setProject(res.data.project))
      .catch(() => { toast.error('Project not found'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!project) return null;

  const isAdmin = project.owner.id === user?.id ||
    project.members.find(m => m.user.id === user?.id)?.role === 'ADMIN';

  const userRole = isAdmin ? 'ADMIN' : 'MEMBER';

  const tasks = project.tasks || [];
  const filteredTasks = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;

  const taskStats = {
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  };

  const handleTaskSaved = (savedTask) => {
    setProject(prev => {
      const exists = prev.tasks.find(t => t.id === savedTask.id);
      if (exists) {
        return { ...prev, tasks: prev.tasks.map(t => t.id === savedTask.id ? savedTask : t) };
      }
      return { ...prev, tasks: [savedTask, ...prev.tasks] };
    });
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/project/${projectId}/${taskId}`);
      toast.success('Task deleted');
      setProject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/api/projects/${projectId}/members/${memberId}`);
      toast.success('Member removed');
      setProject(prev => ({ ...prev, members: prev.members.filter(m => m.user.id !== memberId) }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? This cannot be undone.')) return;
    try {
      await api.delete(`/api/projects/${projectId}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <button onClick={() => navigate('/projects')} className="hover:text-gray-600">Projects</button>
              <span>/</span>
              <span className="text-gray-600">{project.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add task
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          {[
            { label: 'To Do', count: taskStats.TODO, color: 'bg-gray-100 text-gray-600' },
            { label: 'In Progress', count: taskStats.IN_PROGRESS, color: 'bg-blue-100 text-blue-700' },
            { label: 'Done', count: taskStats.DONE, color: 'bg-green-100 text-green-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} px-3 py-1 rounded-full text-xs font-medium`}>
              {s.count} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {['tasks', 'members'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} {tab === 'members' && `(${project.members.length})`}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {['', 'TODO', 'IN_PROGRESS', 'DONE'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  filterStatus === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === '' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s === 'TODO' ? 'To Do' : 'Done'}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-400">No tasks found</p>
              {isAdmin && (
                <button onClick={() => setShowTaskModal(true)} className="btn-primary mt-4 mx-auto">
                  Create first task
                </button>
              )}
            </div>
          ) : (
            <div className="card divide-y divide-gray-50">
              {filteredTasks.map(task => (
                <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {task.assignee && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <div className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-[9px]">
                            {task.assignee.name[0]}
                          </div>
                          {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-xs ${isPast(new Date(task.dueDate)) && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          {isPast(new Date(task.dueDate)) && task.status !== 'DONE' && ' · Overdue'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {priorityBadge[task.priority]}
                    {statusBadge[task.status]}

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAddMember(true)} className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add member
              </button>
            </div>
          )}

          <div className="card divide-y divide-gray-50">
            {project.members.map(member => (
              <div key={member.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
                  {member.user.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{member.user.name}</p>
                  <p className="text-xs text-gray-400">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                  {isAdmin && member.user.id !== project.owner.id && member.user.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-red-100">
              <button onClick={handleDeleteProject} className="text-sm text-red-500 hover:text-red-700 font-medium">
                🗑 Delete this project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          members={project.members}
          task={editingTask}
          userRole={userRole}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onAdded={membership => setProject(prev => ({ ...prev, members: [...prev.members, membership] }))}
        />
      )}
    </div>
  );
}
