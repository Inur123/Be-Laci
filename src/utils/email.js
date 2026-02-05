const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;

const getClient = () => {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!resendApiKey || !resendFrom) return false;
  if (!to || (Array.isArray(to) && to.length === 0)) return false;

  const client = getClient();
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

module.exports = { sendEmail };
