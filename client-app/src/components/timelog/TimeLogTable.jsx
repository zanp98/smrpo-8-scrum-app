import { useEffect, useState } from 'react';
import { deleteTimeLogEntry, getTimeLogEntries, updateTimeLogEntry } from '../../api/backend';
import { formatDateTime, roundNumberToPointOne } from '../../utils/datetime';
import '../../styles/timelog/time-log-table.css';
import { ConfirmDialog } from '../shared/ConfirmDialog';

export const TimeLogTable = ({}) => {
  const [counter, setCounter] = useState(0);
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

  const fetchTimeLogEntries = async () => {
    const data = await getTimeLogEntries();
    setTimeLogsEntries(data);
  };

  useEffect(() => {
    fetchTimeLogEntries();
  }, [counter]);

  return (
    <div className="overflow-x-auto p-4">
      <div>Time log entries</div>
      <table className="time-log-table">
        <thead>
          <tr className="">
            <th>Story</th>
            <th>Task</th>
            <th>Time (in hours)</th>
            <th>Description</th>
            <th>Created At</th>
            <th>Actions</th>
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
                  <td className="px-4 py-2 space-x-2">
                    {editingEntry === tle._id ? (
                      <>
                        <button className="btn-save" onClick={async () => await saveChanges(tle)}>
                          Save
                        </button>
                        <button className="btn-cancel" onClick={() => setEditingEntry(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-edit" onClick={() => startEditing(tle)}>
                          Edit
                        </button>
                        <button
                          className="btn-delete"
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
