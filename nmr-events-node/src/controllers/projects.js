'use strict';
const { portfolio, booths } = require('../data/portfolio');

/** GET /api/projects: portfolio items and the 3D booth/stage assets. Optional ?category= filter. */
function list(req, res) {
  const { category } = req.query;
  const items = typeof category === 'string' && category !== 'all'
    ? portfolio.filter((p) => p.category === category)
    : portfolio;
  res.json({ portfolio: items, booths });
}

module.exports = { list };
