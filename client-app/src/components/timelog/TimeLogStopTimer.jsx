import { useState } from 'react';

export const TimeLogStopTimer = ({ stopTimer, close }) => {
  const [description, setDescription] = useState('');
  return (
    <div className="p-4 max-w-md mx-auto">
      <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full border rounded-md p-2 text-sm shadow-sm"
        placeholder="Enter a description..."
        style={{ width: '100%' }}
      />
      <button
        onClick={() => stopTimer(description)}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        style={{ margin: '5px' }}
      >
        Stop timer
      </button>
      <button
        onClick={close}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        style={{ margin: '5px' }}
      >
        Cancel
      </button>
    </div>
  );
};
