import { Discussion, Event } from './Discussion';
import GitHubRepository from './GithubReposity';
import { WebClient } from '@slack/web-api';
import axios from 'axios';
import {
  Handler,
  HandlerResponse,
  HandlerEvent,
  HandlerContext,
} from '@netlify/functions';

require('dotenv').config();
const client = new WebClient(process.env.SLACK_TOKEN);
let githubReposity: GitHubRepository;
let discussions: Map<string, Discussion> = new Map();

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  console.log('function callded');
  console.log(event);
  return {
    statusCode: 200,
    body: '{}',
  };
};

export { handler };

// app.post('/save', async (req, res) => {
//   res.status(200).send();
//   const payload = JSON.parse(req.body.payload);
//   if (!payload) return;
//   if (payload.type === 'message_action') {
//     console.log(payload);
//     const discussion = new Discussion(
//       payload.message.ts,
//       payload.channel.id,
//       payload.response_url
//     );
//     try {
//       await discussion.parseReplies();
//     } catch (err: any) {
//       axios.post(discussion.responseUrl, {
//         text: err.message,
//       });
//       console.error(err);
//       return;
//     }
//     discussions.set(payload.user.id, discussion);
//     showPrompt(payload.trigger_id);
//   } else if (payload.type === 'dialog_submission') {
//     const discussion = discussions.get(payload.user.id);
//     if (!discussion) return;
//     discussion.setTitle(payload.submission.title);
//     discussion.setCategory(payload.submission.category);

//     const discussionUrl = await githubReposity.createDiscussion(discussion);
//     if (discussionUrl) {
//       discussion.postMessage(
//         'this discussion has been preserved here: ' + discussionUrl
//       );
//     }
//     discussions.delete(payload.user.id);
//     res.status(200).send();
//   }
// });

// const PORT = parseInt(process.env.PORT!, 10);
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
// function showPrompt(trigger_id: string) {
//   client.dialog.open({
//     dialog: {
//       callback_id: 'ryde-46e2b0',
//       title: 'Save to GitHub',
//       submit_label: 'Save',
//       notify_on_cancel: false,
//       state: 'Limo',
//       elements: [
//         {
//           type: 'text',
//           label: 'Title',
//           name: 'title',
//         },
//         {
//           type: 'select',
//           options: Object.entries(githubReposity.discussionCategories).map(
//             ([category, id]) => {
//               return { label: toTitleCase(category), value: id as string };
//             }
//           ),
//           label: 'Category',
//           name: 'category',
//         },
//       ],
//     },
//     trigger_id,
//   });
// }
// function toTitleCase(title: string) {
//   return title
//     .split(' ')
//     .map((word: string) => {
//       return word[0].toUpperCase() + word.substring(1);
//     })
//     .join(' ');
// }
// async function run() {
//   githubReposity = await GitHubRepository.getInstance(
//     process.env.REPO_OWNER!,
//     process.env.REPO_NAME!
//   );
// }

// run();
