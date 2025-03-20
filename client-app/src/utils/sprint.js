export const calculateTotalStoryPoints = (userStories) =>
  userStories.map((s) => s.points).reduce((acc, curr) => acc + curr, 0);
