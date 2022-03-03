import { Discussion, Event } from './Discussion';
import { createEventAdapter } from '@slack/events-api';
import GitHubRepository from './GithubReposity';
require('dotenv').config();

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
async function run() {
  const gitHubRepository = await GitHubRepository.getInstance(
    process.env.REPO_OWNER!,
    process.env.REPO_NAME!
  );

  slackEvents.on('app_mention', async (event: Event) => {
    const command = event.text.split(' ')[1];
    let discussion = new Discussion(event);
    try {
      if (command === 'help') {
        discussion.postMessage(
          `Here is a list of what I can currently do for you:\n- Save the current thread in \`support\` repo. \n\t- Synctax:\`save <discussion_title> [discussion_category]\` \n\t- \`discussion_title\`: the title of the discussion that should be saved in github discussions.(mandatory) \n\t- \`discussion_category\` : can be \`${Object.keys(
            gitHubRepository.discussionCategories
          ).join(', ')}\` (default: Q&A).`
        );
      } else if (command === 'save') {
        await discussion.parseReplies();
        if (!discussion.title) throw new Error('no title has been provided.');
        if (!discussion.hasAnswer && discussion.category === 'q&a') {
          throw Error(
            `Q&A category requires an answer. please mark your answer by :white_check_mark: reaction to your answer in this thread or specify another category. eg. \`save 'your title' general\``
          );
        }
        const discussionURL = await gitHubRepository.createDiscussion(
          discussion
        );
        discussion.postMessage(
          `this conversation has been preserved here: ${discussionURL}`
        );
      } else {
        throw Error(
          `Can't understand what you want me to do. you can always mention me with \`help\` command.`
        );
      }
    } catch (err: any) {
      discussion.postMessage(
        err.message ||
          "Something, somewhere went terribly wrong. that's all I know."
      );
      console.error(err);
    }
  });

  slackEvents.on('error', console.log);

  const PORT = parseInt(process.env.PORT!, 10);
  slackEvents.start(PORT).then(() => {
    console.log(`Server listening on port ${PORT}`);
  });
}

run();
