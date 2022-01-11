const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
require('dotenv').config();

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_PORT = process.env.SLACK_PORT || 3000;

console.log(SLACK_SIGNING_SECRET);
const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
const slackClient = new WebClient(SLACK_TOKEN);

slackEvents.on('app_mention', async (event) => {
  console.log(event);
  const isSave = event.text.includes('save') || event.text.includes('store');
  let message = '';
  if (!event.thread_ts && isSave) {
    message = `Hey <@${event.user}>! I am not sure I understand what you want me to do, If you want me to save a thread in the \`community\` repo, please ask me in a thread.`;
  } else if (!isSave) {
    message = `Hey <@${event.user}>! I am not sure I understand what you want me to do.`;
  }
  try {
    await slackClient.chat.postMessage({
      channel: event.channel,
      text: message || 'Saved',
      as_user: true,
      thread_ts: event.thread_ts,
    });
  } catch (err) {
    console.log(err);
  }
});

slackEvents.on('error', console.error);

slackEvents.start(SLACK_PORT).then(() => {
  console.log(`Server listening on port ${SLACK_PORT}`);
});
