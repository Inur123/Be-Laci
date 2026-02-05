const toIsoNoMillis = (value) => {
  if (!(value instanceof Date)) return value;
  const iso = value.toISOString();
  return iso.replace(/\.\d{3}Z$/, "Z");
};

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date);

const serializeDates = (value) => {
  if (value instanceof Date) return toIsoNoMillis(value);
  if (Array.isArray(value)) return value.map((item) => serializeDates(item));
  if (isPlainObject(value)) {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = serializeDates(val);
      return acc;
    }, {});
  }
  return value;
};

const ok = (res, data, message = "OK", meta) => {
  const payload = { success: true, message, data: serializeDates(data) };
  if (meta !== undefined) payload.meta = serializeDates(meta);
  return res.json(payload);
};

const created = (res, data, message = "Created", meta) => {
  const payload = { success: true, message, data: serializeDates(data) };
  if (meta !== undefined) payload.meta = serializeDates(meta);
  return res.status(201).json(payload);
};

const paginateMeta = ({ page, limit, total }) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { page, limit, total, totalPages };
};

module.exports = { ok, created, paginateMeta };
