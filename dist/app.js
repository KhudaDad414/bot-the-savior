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
const GithubReposity_1 = __importDefault(require("./GithubReposity"));
const web_api_1 = require("@slack/web-api");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
const app = (0, express_1.default)();
const client = new web_api_1.WebClient(process.env.SLACK_TOKEN);
let githubReposity;
let discussions = new Map();
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.post('/save', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send();
    const payload = JSON.parse(req.body.payload);
    if (!payload)
        return;
    if (payload.type === 'message_action') {
        console.log(payload);
        const discussion = new Discussion_1.Discussion(payload.message.ts, payload.channel.id, payload.response_url);
        try {
            yield discussion.parseReplies();
        }
        catch (err) {
            axios_1.default.post(discussion.responseUrl, {
                text: err.message,
            });
            console.error(err);
            return;
        }
        discussions.set(payload.user.id, discussion);
        showPrompt(payload.trigger_id);
    }
    else if (payload.type === 'dialog_submission') {
        const discussion = discussions.get(payload.user.id);
        if (!discussion)
            return;
        discussion.setTitle(payload.submission.title);
        discussion.setCategory(payload.submission.category);
        const discussionUrl = yield githubReposity.createDiscussion(discussion);
        if (discussionUrl) {
            discussion.postMessage('this discussion has been preserved here: ' + discussionUrl);
        }
        discussions.delete(payload.user.id);
        res.status(200).send();
    }
}));
const PORT = parseInt(process.env.PORT, 10);
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
function showPrompt(trigger_id) {
    client.dialog.open({
        dialog: {
            callback_id: 'ryde-46e2b0',
            title: 'Save to GitHub',
            submit_label: 'Save',
            notify_on_cancel: false,
            state: 'Limo',
            elements: [
                {
                    type: 'text',
                    label: 'Title',
                    name: 'title',
                },
                {
                    type: 'select',
                    options: Object.entries(githubReposity.discussionCategories).map(([category, id]) => {
                        return { label: toTitleCase(category), value: id };
                    }),
                    label: 'Category',
                    name: 'category',
                },
            ],
        },
        trigger_id,
    });
}
function toTitleCase(title) {
    return title
        .split(' ')
        .map((word) => {
        return word[0].toUpperCase() + word.substring(1);
    })
        .join(' ');
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        githubReposity = yield GithubReposity_1.default.getInstance(process.env.REPO_OWNER, process.env.REPO_NAME);
    });
}
run();
