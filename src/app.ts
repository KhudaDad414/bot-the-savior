import { Discussion, Event } from './Discussion';
import { createEventAdapter } from '@slack/events-api';
// @ts-ignore
import splitargs from 'splitargs';
require('dotenv').config();

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const SLACK_PORT = process.env.SLACK_PORT || '3000';

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

  const discussion = new Discussion(event);
  try {
    await discussion.parseReplies();
    if (!discussion.hasAnswer && discussionGroup === 'Q&amp;A') {
      throw Error(
        `you don't have any accepted answer for this thread. please mark your answer by :white_check_mark: reaction to your answer.`
      );
    }
    if (command === 'save') {
      const discussionURL = await discussion.storeToGitHubDiscussions(
        getDiscussionGroupId(discussionGroup || 'Q&amp;A')
      );
      discussion.postMessage(
        `this conversation has been preserved here: ${discussionURL}`
      );
    } else {
      throw Error(
        `Can't understand what you want me to do.\nHere is a list of what I can currently do for you:\n- Save the current thread in\`support\`repo. \n\t- Synctax:\`save <discussion_title> [discussion_category]\` \n\t- Description: The title is mandatory. I will save the discussion in \`Q&A\` category if no \`[discussion_category]\` is provided.`
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

slackEvents.on('error', console.error);

slackEvents.start(parseInt(SLACK_PORT, 10)).then(() => {
  console.log(`Server listening on port ${SLACK_PORT}`);
});
