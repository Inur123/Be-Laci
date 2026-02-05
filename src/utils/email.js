const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;

const client = resendApiKey ? new Resend(resendApiKey) : null;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!resendApiKey || !resendFrom) return false;
  if (!to || (Array.isArray(to) && to.length === 0)) return false;

  if (!client) return false;

  await client.emails.send({
    from: resendFrom,
    to,
    subject,
    html,
    text,
  });

  return true;
};

const queue = [];
let active = 0;
const concurrency = Math.max(parseInt(process.env.EMAIL_CONCURRENCY || "2", 10), 1);
let scheduled = false;

const processQueue = () => {
  while (active < concurrency && queue.length > 0) {
    const payload = queue.shift();
    active += 1;
    sendEmail(payload)
      .catch(() => {
      })
      .finally(() => {
        active -= 1;
        schedule();
      });
  }
};

const schedule = () => {
  if (scheduled) return;
  scheduled = true;
  setImmediate(() => {
    scheduled = false;
    processQueue();
  });
};

const enqueueEmail = (payload) => {
  if (!resendApiKey || !resendFrom) return false;
  if (!payload?.to || (Array.isArray(payload.to) && payload.to.length === 0)) return false;
  if (!client) return false;
  queue.push(payload);
  schedule();
  return true;
};

module.exports = { sendEmail, enqueueEmail };
