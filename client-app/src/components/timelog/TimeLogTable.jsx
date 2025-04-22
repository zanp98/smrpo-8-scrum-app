import { useEffect, useMemo, useState } from 'react';
import { deleteTimeLogEntry, getTimeLogEntries, updateTimeLogEntry } from '../../api/backend';
import { formatDateTime, roundNumberToPointOne } from '../../utils/datetime';
import '../../styles/timelog/time-log-table.css';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ProjectRole } from '../project/ProjectForm';

export const TimeLogTable = ({ projects, projectRoles }) => {
  const [counter, setCounter] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [timeLogEntries, setTimeLogsEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formState, setFormState] = useState({ time: '', description: '' });

  const startEditing = (tle) => {
    setEditingEntry(tle._id);
    setFormState({ time: roundNumberToPointOne(tle.time), description: tle.description });
  };

  const saveChanges = async (tle) => {
    try {
      await updateTimeLogEntry(tle._id, formState);
      setCounter((c) => c + 1);
      setEditingEntry(null);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteEntry = async (tleId) => {
    try {
      await deleteTimeLogEntry(tleId);
      setCounter((c) => c + 1);
      setEditingEntry(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsConfirmOpen(false);
      setPendingDelete(false);
    }
  };

  const fetchTimeLogEntries = async (projectId) => {
    const data = await getTimeLogEntries(projectId);
    setTimeLogsEntries(data);
  };

  useEffect(() => {
    if (!selectedProject) {
      return;
    }
    fetchTimeLogEntries(selectedProject);
  }, [selectedProject, counter]);

  const activeProjectRole = useMemo(() => {
    if (!selectedProject) {
      return null;
    }
    return projectRoles.find((pr) => pr.project._id === selectedProject)?.role;
  }, [selectedProject]);

  if ((projects ?? []).length === 0) {
    return 'You have no projects';
  }
  return (
    <div className="overflow-x-auto p-4">
      <div>Time log entries</div>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <label
          className="select-project"
          htmlFor="project-select"
          style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}
        >
          Select Project:
        </label>
        <select
          id="project-select"
          onChange={(e) => setSelectedProject(e.target.value)}
          value={selectedProject || ''}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            maxWidth: '250px',
          }}
        >
          <option value="">-- Choose a project --</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <table className="time-log-table">
        <thead>
          <tr className="">
            <th>Story</th>
            <th>Task</th>
            <th>Time (in hours)</th>
            <th>Description</th>
            <th>Created At</th>
            {[ProjectRole.DEVELOPER, ProjectRole.ADMIN].includes(activeProjectRole) && (
              <th>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {timeLogEntries?.map((story) =>
            story.tasks?.map((task) =>
              task.timeLogEntries?.map((tle) => (
                <tr key={tle._id} className="border-t">
                  <td className="px-4 py-2">{story.description}</td>
                  <td className="px-4 py-2">{task.description}</td>
                  <td className="px-4 py-2">
                    {editingEntry === tle._id ? (
                      <input
                        className="border rounded p-1"
                        type="text"
                        value={formState.time}
                        onChange={(e) => setFormState({ ...formState, time: e.target.value })}
                      />
                    ) : (
                      roundNumberToPointOne(tle.time)
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingEntry === tle._id ? (
                      <input
                        className="border rounded p-1"
                        type="text"
                        value={formState.description}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            description: e.target.value,
                          })
                        }
                      />
                    ) : (
                      tle.description
                    )}
                  </td>
                  <td className="px-4 py-2">{formatDateTime(tle.createdAt)}</td>
                  {[ProjectRole.DEVELOPER, ProjectRole.ADMIN].includes(activeProjectRole) && (
                    <td className="px-4 py-2 space-x-2">
                      {editingEntry === tle._id ? (
                        <>
                          <button
                            className="btn-save"
                            disabled={task.status === 'DONE' || story.status === 'DONE'}
                            onClick={async () => await saveChanges(tle)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-cancel"
                            disabled={task.status === 'DONE' || story.status === 'DONE'}
                            onClick={() => setEditingEntry(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-edit"
                            disabled={task.status === 'DONE' || story.status === 'DONE'}
                            onClick={() => startEditing(tle)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            disabled={task.status === 'DONE' || story.status === 'DONE'}
                            onClick={() => {
                              setIsConfirmOpen(true);
                              setPendingDelete(tle._id);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              )),
            ),
          )}
        </tbody>
      </table>
      <ConfirmDialog
        message="Are you sure you want to delete the entry?"
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={async () => await deleteEntry(pendingDelete)}
      />
    </div>
  );
};
