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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Discussion = void 0;
const web_api_1 = require("@slack/web-api");
class Discussion {
    constructor(_ts, _channelId, responseUrl) {
        this._ts = _ts;
        this._channelId = _channelId;
        this.responseUrl = responseUrl;
        this.slackClient = new web_api_1.WebClient(process.env.SLACK_TOKEN);
        this._message = '';
        this._replies = [];
        this._hasAnswer = false;
    }
    setTitle(title) {
        this._title = title;
    }
    get title() {
        var _a;
        return (_a = this._title) !== null && _a !== void 0 ? _a : '';
    }
    setCategory(category) {
        this._category = category;
    }
    get category() {
        var _a;
        return (_a = this._category) !== null && _a !== void 0 ? _a : '';
    }
    parseReplies() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let response;
            try {
                response = yield this.slackClient.conversations.history({
                    channel: this._channelId,
                    latest: this._ts,
                    limit: 1,
                    inclusive: true,
                });
            }
            catch (err) {
                throw new Error("can't preserve this conversation since I am not a member of this channel. Please invite me using `/invite @Chan` first.");
            }
            if (!response.messages)
                return;
            this._message = (_a = response.messages[0]) === null || _a === void 0 ? void 0 : _a.text;
            if (response.messages)
                this._thread_ts = response.messages[0].thread_ts;
            if (!this._thread_ts)
                return;
            const { messages } = yield this.slackClient.conversations.replies({
                channel: this._channelId,
                ts: this._thread_ts,
            });
            if (!messages || messages.length === 0) {
                throw new Error("The message that you are trying to preserve, doesn't have any replies so we can't preserve it.");
            }
            this._replies = messages.map((message) => {
                const isAnswer = message.reactions &&
                    message.reactions.filter((reaction) => reaction.name === 'white_check_mark').length > 0;
                if (isAnswer) {
                    this._hasAnswer = true;
                }
                return { body: message.text, isAnswer, ts: message.ts };
            });
        });
    }
    postMessage(message) {
        this.slackClient.chat.postMessage({
            channel: this._channelId,
            text: message,
            as_user: true,
            thread_ts: this._thread_ts,
            icon_url: 'https://avatars.githubusercontent.com/u/61865014',
        });
    }
}
exports.Discussion = Discussion;
