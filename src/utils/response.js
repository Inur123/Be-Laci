const ok = (res, data, message = "OK", meta) => {
  const payload = { success: true, message, data };
  if (meta !== undefined) payload.meta = meta;
  return res.json(payload);
};

const created = (res, data, message = "Created", meta) => {
  const payload = { success: true, message, data };
  if (meta !== undefined) payload.meta = meta;
  return res.status(201).json(payload);
};

const paginateMeta = ({ page, limit, total }) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { page, limit, total, totalPages };
};

module.exports = { ok, created, paginateMeta };
