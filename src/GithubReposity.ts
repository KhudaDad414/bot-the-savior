import fetchGraphql from './fetchGraphql';
import { Discussion } from './Discussion';
export default class GitHubRepository {
  private constructor(
    public repoId: string,
    public discussionCategories: any
  ) {}

  static async getInstance(owner: string, name: string) {
    const { repository } = await fetchGraphql(
      `query { 
      repository(owner: "${owner}", name: "${name}"){
        id
        discussionCategories(first: 10) {
          nodes {
            name
            id
          }
        }
      }
    }`
    );

    const discussionCategories = repository.discussionCategories.nodes.reduce(
      (acc: any, category: any) => {
        return { ...acc, [category.name.toLowerCase()]: category.id };
      },
      {}
    );

    return new GitHubRepository(repository.id, discussionCategories);
  }
  async createDiscussion(discussion: Discussion) {
    if (!this.discussionCategories) {
      console.error(
        'please make sure to call parseDiscussionCategories() before creating a discussion.'
      );
      return;
    }
    if (!(discussion.category in this.discussionCategories))
      throw Error(
        `You have provided '${discussion.category}' as the discussion category and I can't find it.`
      );
    const { createDiscussion } = await fetchGraphql(
      `
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
    `
    );
    const gitHubDiscussionId = createDiscussion.discussion.id;
    this.createDicussionComments(gitHubDiscussionId, discussion);
    return createDiscussion.discussion.url;
  }
  private async createDicussionComments(
    gitHubDiscussionId: string,
    discussion: Discussion
  ) {
    if (!discussion.replies) return;
    discussion.replies.map(async (message) => {
      const { addDiscussionComment } = await fetchGraphql(
        `
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
    `
      );
      const commentId = addDiscussionComment.comment.id;
      if (message.isAnswer && commentId) {
        this.markAnswer(commentId);
      }
    });
  }
  private markAnswer(commentId: string) {
    fetchGraphql(
      `
  mutation {
    markDiscussionCommentAsAnswer(input: {id: "${commentId}" }) {
      discussion {
        id
      }
    }
  }
  `
    );
  }
}
