import { Discussion, Event } from './Discussion';
import { createEventAdapter } from '@slack/events-api';
// @ts-ignore
import splitargs from 'splitargs';
require('dotenv').config();

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

function getDiscussionGroupId(groupName: string): string {
  switch (groupName.toLowerCase()) {
    case 'q&amp;q':
    case 'q&a':
      return 'DIC_kwDOGp_8nM4CAoNV';
    case 'announcements':
      return 'DIC_kwDOGp_8nM4CAoNT';
    case 'general':
      return 'DIC_kwDOGp_8nM4CAoNU';
    case 'ideas':
      return 'DIC_kwDOGp_8nM4CAoNW';
    case 'show and tell':
      return 'DIC_kwDOGp_8nM4CAoNX';
    default:
      throw Error(
        `You have provided '${groupName}' as the discussion category and I can't find it.`
      );
  }
}

const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);

slackEvents.on('app_mention', async (event: Event) => {
  let [, command, , discussionGroup]: string[] = splitargs(event.text);
  if (!discussionGroup) discussionGroup = 'Q&amp;A';
  let discussion = new Discussion(event);
  try {
    if (command === 'help') {
      throw Error(
        `Here is a list of what I can currently do for you:\n- Save the current thread in\`support\`repo. \n\t- Synctax:\`save <discussion_title> [discussion_category]\` \n\t- Description: \`discussion_title\`: the title of the discussion that should be saved in github discussions.(mandatory) \n \`discussion_category\` : can be \`general,Q&amp;A, ideas, announcements, show and tell q\` (default: Q&amp;A).`
      );
    } else if (command === 'save') {
      await discussion.parseReplies();
      if (!discussion.title) throw new Error('no title has been provided.');
      if (!discussion.hasAnswer && discussionGroup === 'Q&amp;A') {
        throw Error(
          `Q&A category requires an answer. please mark your answer by :white_check_mark: reaction to your answer in this thread or specify another category. eg. \`save 'your title' general\``
        );
      }
      const discussionURL = await discussion.storeToGitHubDiscussions(
        getDiscussionGroupId(discussionGroup || 'Q&amp;A')
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
