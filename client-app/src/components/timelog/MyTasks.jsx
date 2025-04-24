import { useCallback, useEffect, useState } from 'react';
import { getMyTasksWithTimeLogEntries, saveTimeLogEntries } from '../../api/backend';
import '../../styles/timelog/my-tasks.css';
import { orderBy } from 'lodash';
import { formatDate } from '../../utils/datetime';

export const MyTasks = ({ projects }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [counter, setCounter] = useState(0);
  const [userStories, setUserStories] = useState([]);

  const fetchMyTasks = async (projectId) => {
    const data = await getMyTasksWithTimeLogEntries(projectId);
    setUserStories(data?.userStories ?? []);
  };

  const handleInputChange = (storyId, taskId, timeLogEntryId, field, value) => {
    setUserStories((prev) =>
      prev.map((story) => {
        if (story._id !== storyId) {
          return story;
        }
        const tasks = story.tasks.map((task) => {
          if (task._id !== taskId) {
            return task;
          }
          const timeLogEntries = orderBy(
            task.timeLogEntries.map((timeLogEntry) => {
              if (timeLogEntry._id !== timeLogEntryId) {
                return timeLogEntry;
              }
              return {
                ...timeLogEntry,
                [field]: Number(value),
                changed: true,
              };
            }),
            'date',
            'desc',
          );
          return {
            ...task,
            timeLogEntries,
          };
        });
        return {
          ...story,
          tasks,
        };
      }),
    );
  };

  const handleSave = useCallback(
    async (taskId) => {
      const changedTimeLogEntries = userStories
        .flatMap((s) => s.tasks.filter((t) => t._id === taskId).flatMap((t) => t.timeLogEntries))
        .filter((tle) => tle.changed)
        .map((tle) => ({ _id: tle._id, time: tle.time, timeLeft: tle.timeLeft }));

      await saveTimeLogEntries(selectedProject, changedTimeLogEntries);
      setCounter((c) => c + 1);
    },
    [userStories, selectedProject, setCounter],
  );

  useEffect(() => {
    if (!selectedProject) {
      return;
    }
    fetchMyTasks(selectedProject);
  }, [selectedProject, counter]);

  return (
    <div className="overflow-x-auto p-4">
      <div>My tasks</div>
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

        <div className="entity-grid">
          {userStories.flatMap((story) =>
            story?.tasks.map((task) => (
              <div key={task._id} className="entity-box">
                {task.description}

                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Work spent (hours)</th>
                      <th>Remaining (hours)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {task.timeLogEntries.map((tle) => (
                      <tr key={tle._id}>
                        <td>{formatDate(tle.date)}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={tle.time}
                            onChange={(e) =>
                              handleInputChange(
                                story._id,
                                task._id,
                                tle._id,
                                'time',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={tle.timeLeft}
                            onChange={(e) =>
                              handleInputChange(
                                story._id,
                                task._id,
                                tle._id,
                                'timeLeft',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="save-button" onClick={() => handleSave(task._id)}>
                  Save Changes
                </button>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
};
