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
const graphql_1 = require("@octokit/graphql");
class GitHubRepository {
    constructor(repoId, discussionCategories) {
        this.repoId = repoId;
        this.discussionCategories = discussionCategories;
        this.headers = {
            headers: {
                authorization: `token ${process.env.GITHUB_TOKEN}`,
            },
        };
    }
    static getInstance(owner, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const { repository } = yield (0, graphql_1.graphql)(`query { 
      repository(owner: "${owner}", name: "${name}"){
        id
        discussionCategories(first: 10) {
          nodes {
            name
            id
          }
        }
      }
    }`, {
                headers: {
                    authorization: `token ${process.env.GITHUB_TOKEN}`,
                },
            });
            const discussionCategories = repository.discussionCategories.nodes.reduce((acc, category) => {
                return Object.assign(Object.assign({}, acc), { [category.name.toLowerCase()]: category.id });
            }, {});
            return new GitHubRepository(repository.id, discussionCategories);
        });
    }
    createDiscussion(discussion) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.discussionCategories) {
                console.error('please make sure to call parseDiscussionCategories() before creating a discussion.');
                return;
            }
            if (!(discussion.category in this.discussionCategories))
                throw Error(`You have provided '${discussion.category}' as the discussion category and I can't find it.`);
            const { createDiscussion } = yield (0, graphql_1.graphql)(`
      mutation {
        createDiscussion(
          input: {
            repositoryId: "${this.repoId}"
            title: "${discussion.title}"
            body: "${discussion.body}"
            categoryId: "${this.discussionCategories[discussion.category]}"
          }
        ) {
          discussion {
            id
            url
          }
        }
      }
    `, this.headers);
            const gitHubDiscussionId = createDiscussion.discussion.id;
            this.createDicussionComments(gitHubDiscussionId, discussion);
            return createDiscussion.discussion.url;
        });
    }
    createDicussionComments(gitHubDiscussionId, discussion) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!discussion.replies)
                return;
            discussion.replies.map((message) => __awaiter(this, void 0, void 0, function* () {
                const { addDiscussionComment } = yield (0, graphql_1.graphql)(`
      mutation {
        addDiscussionComment(
          input: {
            discussionId: "${gitHubDiscussionId}"
            body: "${message.body}"
          }
        ) {
          comment {
            id
          }
        }
      }
    `, this.headers);
                const commentId = addDiscussionComment.comment.id;
                if (message.isAnswer && commentId) {
                    this.markAnswer(commentId);
                }
            }));
        });
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
  `, this.headers);
    }
}
exports.default = GitHubRepository;
