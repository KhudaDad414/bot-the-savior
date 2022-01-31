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
const graphql_1 = require("@octokit/graphql");
// @ts-ignore
const splitargs_1 = __importDefault(require("splitargs"));
class Discussion {
    constructor(event) {
        this.slackClient = new web_api_1.WebClient(process.env.SLACK_TOKEN);
        this.body = '';
        this.replies = [];
        this.hasAnswer = false;
        const [bot_id, , title] = (0, splitargs_1.default)(event.text);
        this.channel = event.channel;
        this.title = title;
        if (!this.title)
            throw new Error('no title has been provided.');
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
    storeToGitHubDiscussions(discussionCategoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { createDiscussion } = yield (0, graphql_1.graphql)(`
      mutation {
        createDiscussion(
          input: {
            repositoryId: "R_kgDOGp_8nA"
            title: "${this.title}"
            body: "${this.body}"
            categoryId: "${discussionCategoryId}"
          }
        ) {
          discussion {
            id
            url
          }
        }
      }
    `, {
                headers: {
                    authorization: `token ${process.env.GITHUB_TOKEN}`,
                },
            });
            const discussionId = createDiscussion.discussion.id;
            this.storeReplies(discussionId);
            return createDiscussion.discussion.url;
        });
    }
    storeReplies(discussionId) {
        if (!this.replies)
            return;
        this.replies.map((message) => __awaiter(this, void 0, void 0, function* () {
            const { addDiscussionComment } = yield (0, graphql_1.graphql)(`
      mutation {
        addDiscussionComment(
          input: {
            discussionId: "${discussionId}"
            body: "${message.body}"
          }
        ) {
          comment {
            id
          }
        }
      }
    `, {
                headers: {
                    authorization: `token ${process.env.GITHUB_TOKEN}`,
                },
            });
            const commentId = addDiscussionComment.comment.id;
            if (message.isAnswer && commentId) {
                this.markAnswer(commentId);
            }
        }));
    }
    markAnswer(commentId) {
        (0, graphql_1.graphql)(`
  mutation {
    markDiscussionCommentAsAnswer(input: {id: "${commentId}" }) {
      discussion {
        id
      }
    }
  }
  `, {
            headers: {
                authorization: `token ${process.env.GITHUB_TOKEN}`,
            },
        });
    }
    postMessage(message) {
        this.slackClient.chat.postMessage({
            channel: this.channel,
            text: message,
            as_user: true,
            thread_ts: this.thread_ts,
        });
    }
}
exports.Discussion = Discussion;
