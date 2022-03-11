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
exports.Discussion = void 0;
const web_api_1 = require("@slack/web-api");
// @ts-ignore
const splitargs_1 = __importDefault(require("splitargs"));
class Discussion {
    constructor(event) {
        this.slackClient = new web_api_1.WebClient(process.env.SLACK_TOKEN);
        this.body = '';
        this.replies = [];
        this.hasAnswer = false;
        const [bot_id, , title, category] = (0, splitargs_1.default)(event.text);
        this.category = (category === null || category === void 0 ? void 0 : category.toLowerCase()) || 'q&a';
        if (this.category === 'q&amp;a')
            this.category = 'q&a';
        this.channel = event.channel;
        this.title = title;
        this.thread_ts = event.thread_ts;
        this.botId = bot_id.slice(2, 13);
    }
    parseReplies() {
        return __awaiter(this, void 0, void 0, function* () {
            const threadMessages = yield this.slackClient.conversations.replies({
                channel: this.channel,
                ts: this.thread_ts,
            });
            if (threadMessages.messages) {
                this.body = threadMessages.messages[0].text;
                this.replies = threadMessages.messages
                    .slice(1)
                    .filter((message) => !(message.text.includes(this.botId) || message.user === this.botId))
                    .map((message) => {
                    const isAnswer = message.reactions &&
                        message.reactions.filter((reaction) => reaction.name === 'white_check_mark').length > 0;
                    if (isAnswer) {
                        this.hasAnswer = true;
                    }
                    return { body: message.text, isAnswer, ts: message.ts };
                });
            }
            else {
                console.error("couldn't fetch the thread.");
            }
        });
    }
    postMessage(message) {
        this.slackClient.chat.postMessage({
            channel: this.channel,
            text: message,
            as_user: true,
            thread_ts: this.thread_ts,
            icon_url: 'https://avatars.githubusercontent.com/u/61865014',
        });
    }
}
exports.Discussion = Discussion;
