import { useEffect, useState, useCallback } from "react"
import "../../styles/forms.css"
import { getProjectSprints, updateCurrentSprint} from '../../api/backend';
import { SprintStatus } from "./SprintForm" // Import SprintStatus from SprintForm

export const SprintEditForm = ({ onClose, sprintId, activeProjectId }) => {
  const [formData, setFormData] = useState({
    name: "",
    project: "",
    startDate: "",
    endDate: "",
    expectedVelocity: 1,
    goal: "",
    status: SprintStatus.PLANNING,
  })

  const [sprints, setSprints] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSprintSelect = useCallback(async (sprintId) => {
    const selectedSprint = sprints.find((sprint) => sprint._id === sprintId);
    if (selectedSprint) {
      try {
        const tempStartDate = new Date(selectedSprint.startDate).toISOString().split('T')[0];
        const tempEndDate = new Date(selectedSprint.endDate).toISOString().split('T')[0];
        
        setFormData({
          name: selectedSprint.name,
          project: selectedSprint.project,
          startDate: tempStartDate,
          endDate: tempEndDate,
          expectedVelocity: selectedSprint.expectedVelocity,
          goal: selectedSprint.goal,
          status: selectedSprint.status,
        });
      } catch (err) {
        console.error('Failed to fetch project users:', err);
        setError('Failed to load project users.');
      }
    }
  }, [sprints]);

  // 1. Fetch all sprints
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const sprints = await getProjectSprints(activeProjectId);
        setSprints(sprints);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load sprints:', err);
        setError('Failed to load sprints.');
        setLoading(false);
      }
    };

    fetchSprints();
  }, [activeProjectId]);

  // 2. Select active sprint
  useEffect(() => {
    if (sprints.length && sprintId) {
      const selected = sprints.find((p) => String(p._id) === String(sprintId));
      if (selected) {
        handleSprintSelect(selected._id);
      }
    }
  }, [sprints, sprintId, handleSprintSelect]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    try {
      e.preventDefault()
      setError(null)
      setSuccess(null)
      setLoading(true)

      if (!formData.name) {
        setError("Sprint name is required.");
        setLoading(false);
        return;
      }
      if (!formData.startDate) {
        setError("Start date is required.");
        setLoading(false);
        return;
      }
      if (!formData.endDate) {
        setError("End date is required.");
        setLoading(false);
        return;
      }
      if (!formData.expectedVelocity) {
        setError("Expected velocity is required.");
        setLoading(false);
        return;
      }

      const result = await updateCurrentSprint(sprintId, formData);
      console.log('Sprint updated successfully:', result);
      onClose();
    } catch (err) {
        console.error('Sprint update failed:', err);
        setError('Failed to update sprint.');
    }
  };
    
  

  return (
    <div className="general-form-container">
      <h3 onClick={onClose}>^</h3>
      <h3>Edit Sprint</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="general-form">
        <input type="hidden" name="project" value={formData.project} />
        
        <div className="form-group">
          <label htmlFor="name">Sprint Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="expectedVelocity">Expected Velocity (in story points)</label>
          <input
            type="number"
            id="expectedVelocity"
            name="expectedVelocity"
            min="1"
            value={formData.expectedVelocity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="goal">Sprint Goal</label>
          <textarea id="goal" name="goal" value={formData.goal} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value={SprintStatus.PLANNING}>Planning</option>
            <option value={SprintStatus.ACTIVE}>Active</option>
            <option value={SprintStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Updating..." : "Update Sprint"}
        </button>
      </form>
    </div>
  )
}
