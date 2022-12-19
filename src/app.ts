import { Discussion, Event } from './Discussion';
import { createEventAdapter } from '@slack/events-api';
import GitHubRepository from './GithubReposity';
import { WebClient } from '@slack/web-api';
import express from 'express';
import bodyParser from 'body-parser';



require('dotenv').config();
const app = express();
const client = new WebClient(process.env.SLACK_TOKEN);
app.use(bodyParser.urlencoded({extended: true}));

app.post('/save', (req, res) => {
  const payload = JSON.parse(req.body.payload);
  console.log(payload);
  // Save the data to a database or file system
  client.dialog.open({
    dialog: {
      "callback_id": "ryde-46e2b0",
      "title": "Save to GitHub",
      "submit_label": "Save",
      "notify_on_cancel": false,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Title",
              "name": "loc_origin"
          },
          {
              "type": "text",
              "label": "Category",
              "name": "loc_destination"
          }
      ]
    },
    trigger_id: payload.trigger_id
  })
});
app.post('/categories', (req, res) => {
  const data = req.body;
  console.log(req);
  // Save the data to a database or file system
  res.send('["Hi","Me"]');
});

const PORT = parseInt(process.env.PORT!, 10);
app.listen( PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



// 

// const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
// const slackEvents = createEventAdapter(SLACK_SIGNING_SECRET);
// async function run() {
//   const gitHubRepository = await GitHubRepository.getInstance(
//     process.env.REPO_OWNER!,
//     process.env.REPO_NAME!
//   );

//   slackEvents.on('app_mention', async (event: Event) => {
//     const command = event.text.split(' ')[1];
//     let discussion = new Discussion(event);
//     try {
//       if (command === 'help') {
//         discussion.postMessage(
//           `Here is a list of what I can currently do for you:\n- Save the current thread in \`support\` repo. \n\t- Synctax:\`save <discussion_title> [discussion_category]\` \n\t- \`discussion_title\`: the title of the discussion that should be saved in github discussions.(mandatory) \n\t- \`discussion_category\` : can be \`${Object.keys(
//             gitHubRepository.discussionCategories
//           ).join(', ')}\` (default: Q&A).`
//         );
//       } else if (command === 'save') {
//         await discussion.parseReplies();
//         if (!discussion.title) throw new Error('no title has been provided.');
//         if (!discussion.hasAnswer && discussion.category === 'q&a') {
//           throw Error(
//             `Q&A category requires an answer. please mark your answer by :white_check_mark: reaction to your answer in this thread or specify another category. eg. \`save 'your title' general\``
//           );
//         }
//         const discussionURL = await gitHubRepository.createDiscussion(
//           discussion
//         );
//         discussion.postMessage(
//           `this conversation has been preserved here: ${discussionURL}`
//         );
//       } else {
//         throw Error(
//           `Can't understand what you want me to do. you can always mention me with \`help\` command.`
//         );
//       }
//     } catch (err: any) {
//       discussion.postMessage(
//         err.message ||
//           "Something, somewhere went terribly wrong. that's all I know."
//       );
//       console.error(err);
//     }
//   });

//   slackEvents.on('error', console.log);
// }

// run();
