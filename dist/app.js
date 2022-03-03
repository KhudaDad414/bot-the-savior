"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Discussion_1 = require("./Discussion");
const events_api_1 = require("@slack/events-api");
const GithubReposity_1 = __importDefault(require("./GithubReposity"));
require('dotenv').config();
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const slackEvents = (0, events_api_1.createEventAdapter)(SLACK_SIGNING_SECRET);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const gitHubRepository = yield GithubReposity_1.default.getInstance(process.env.REPO_OWNER, process.env.REPO_NAME);
        slackEvents.on('app_mention', (event) => __awaiter(this, void 0, void 0, function* () {
            const command = event.text.split(' ')[1];
            let discussion = new Discussion_1.Discussion(event);
            try {
                if (command === 'help') {
                    discussion.postMessage(`Here is a list of what I can currently do for you:\n- Save the current thread in \`support\` repo. \n\t- Synctax:\`save <discussion_title> [discussion_category]\` \n\t- \`discussion_title\`: the title of the discussion that should be saved in github discussions.(mandatory) \n\t- \`discussion_category\` : can be \`${Object.keys(gitHubRepository.discussionCategories).join(', ')}\` (default: Q&A).`);
                }
                else if (command === 'save') {
                    yield discussion.parseReplies();
                    if (!discussion.title)
                        throw new Error('no title has been provided.');
                    if (!discussion.hasAnswer && discussion.category === 'q&a') {
                        throw Error(`Q&A category requires an answer. please mark your answer by :white_check_mark: reaction to your answer in this thread or specify another category. eg. \`save 'your title' general\``);
                    }
                    const discussionURL = yield gitHubRepository.createDiscussion(discussion);
                    discussion.postMessage(`this conversation has been preserved here: ${discussionURL}`);
                }
                else {
                    throw Error(`Can't understand what you want me to do. you can always mention me with \`help\` command.`);
                }
            }
            catch (err) {
                discussion.postMessage(err.message ||
                    "Something, somewhere went terribly wrong. that's all I know.");
                console.error(err);
            }
        }));
        slackEvents.on('error', console.log);
        const PORT = parseInt(process.env.PORT, 10);
        slackEvents.start(PORT).then(() => {
            console.log(`Server listening on port ${PORT}`);
        });
    });
}
run();
