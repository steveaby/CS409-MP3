const { badRequest } = require('./errors');

function parseJSONParam(param) {
  if (param === undefined) return undefined;
  try { return JSON.parse(param); }
  catch { throw new Error('Invalid JSON in query string'); }
}

function buildQuery(model, req, defaultLimit) {
  // accept both ?where= and ?filter= (seed scripts use filter)
  const where = parseJSONParam(req.query.where) ?? parseJSONParam(req.query.filter);
  const select = parseJSONParam(req.query.select);
  const sort = parseJSONParam(req.query.sort);
  const skip = req.query.skip ? parseInt(req.query.skip, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : defaultLimit;
  const count = (req.query.count === 'true');

  let q = model.find(where || {});
  if (select) q = q.select(select);
  if (sort) q = q.sort(sort);
  if (Number.isInteger(skip)) q = q.skip(skip);
  if (!count && Number.isInteger(limit)) q = q.limit(limit);

  return { query: q, count, select };
}

function handleQuery(model, defaultLimit = undefined) {
  return async (req, res, next) => {
    try {
      const { query, count } = buildQuery(model, req, defaultLimit);
      if (count) {
        const c = await model.countDocuments(query.getQuery());
        req.queryResult = { count: c };
      } else {
        const docs = await query.exec();
        req.queryResult = docs;
      }
      next();
    } catch (e) {
      return badRequest(res, e.message);
    }
  };
}

module.exports = { buildQuery, handleQuery, parseJSONParam };
