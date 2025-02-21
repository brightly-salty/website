import getStatsHelper from './get-stats-helper.js';
import getUserId from '../get-user-id.js';

async function getAlternateSubcategoryStats ({ username, questionType, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const userId = await getUserId(username);
  return await getStatsHelper({ userId, questionType, groupByField: 'alternate_subcategory', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}

export default getAlternateSubcategoryStats;
