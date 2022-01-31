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
// @ts-ignore
const splitargs_1 = __importDefault(require("splitargs"));
require('dotenv').config();
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
function getDiscussionGroupId(groupName) {
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
            throw Error(`You have provided '${groupName}' as the discussion category and I can't find it.`);
    }
}
const slackEvents = (0, events_api_1.createEventAdapter)(SLACK_SIGNING_SECRET);
slackEvents.on('app_mention', (event) => __awaiter(void 0, void 0, void 0, function* () {
    let [, command, , discussionGroup] = (0, splitargs_1.default)(event.text);
    if (!discussionGroup)
        discussionGroup = 'Q&amp;A';
    const discussion = new Discussion_1.Discussion(event);
    try {
        yield discussion.parseReplies();
        if (!discussion.hasAnswer && discussionGroup === 'Q&amp;A') {
            throw Error(`Q&A category requires an answer. please mark your answer by :white_check_mark: reaction to your answer in this thread or specify another category. eg. \`save 'your title' general\``);
        }
        if (command === 'save') {
            const discussionURL = yield discussion.storeToGitHubDiscussions(getDiscussionGroupId(discussionGroup || 'Q&amp;A'));
            discussion.postMessage(`this conversation has been preserved here: ${discussionURL}`);
        }
        else if (command === 'help') {
            throw Error(`Here is a list of what I can currently do for you:\n- Save the current thread in\`support\`repo. \n\t- Synctax:\`save <discussion_title> [discussion_category]\` \n\t- Description: The title is mandatory. I will save the discussion in \`Q&A\` category if no \`[discussion_category]\` is provided.`);
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
