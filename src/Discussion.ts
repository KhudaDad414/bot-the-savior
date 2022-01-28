import { WebClient } from '@slack/web-api';
import { graphql } from '@octokit/graphql';
// @ts-ignore
import splitargs from 'splitargs';

export interface Event {
  channel: string;
  text: string;
  thread_ts: string;
}

interface DiscussionReply {
  body: string;
  isAnswer: boolean;
  ts: string;
}
export class Discussion {
  private slackClient = new WebClient(process.env.SLACK_TOKEN);
  channel: any;
  title: string;
  thread_ts: string;
  body: string = '';
  replies: DiscussionReply[] = [];
  hasAnswer: boolean = false;
  botId: string;

  constructor(event: Event) {
    const [bot_id, , title]: string[] = splitargs(event.text);
    this.channel = event.channel;
    this.title = title;
    if (!this.title) throw new Error('no title has been provided.');
    this.thread_ts = event.thread_ts;
    this.botId = bot_id.slice(2, 13);
  }

  async parseReplies() {
    const threadMessages = await this.slackClient.conversations.replies({
      channel: this.channel,
      ts: this.thread_ts,
    });
    if (threadMessages.messages) {
      this.body = threadMessages.messages[0].text!;
      this.replies = threadMessages.messages
        .slice(1)
        .filter(
          (message: any) =>
            !(message.text.includes(this.botId) || message.user === this.botId)
        )
        .map((message: any) => {
          const isAnswer =
            message.reactions &&
            message.reactions.filter(
              (reaction: { name: string }) =>
                reaction.name === 'white_check_mark'
            ).length > 0;
          if (isAnswer) {
            this.hasAnswer = true;
          }
          return { body: message.text, isAnswer, ts: message.ts };
        });
    } else {
      console.error("couldn't fetch the thread.");
    }
  }
  async storeToGitHubDiscussions(discussionCategoryId: string) {
    const { createDiscussion } = await graphql(
      `
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
    `,
      {
        headers: {
          authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
    const discussionId = createDiscussion.discussion.id;
    this.storeReplies(discussionId);
    return createDiscussion.discussion.url;
  }

  private storeReplies(discussionId: string) {
    if (!this.replies) return;
    this.replies.map(async (message) => {
      const { addDiscussionComment } = await graphql(
        `
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
    `,
        {
          headers: {
            authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
        }
      );
      const commentId = addDiscussionComment.comment.id;
      if (message.isAnswer && commentId) {
        this.markAnswer(commentId);
      }
    });
  }

  private markAnswer(commentId: string) {
    graphql(
      `
  mutation {
    markDiscussionCommentAsAnswer(input: {id: "${commentId}" }) {
      discussion {
        id
      }
    }
  }
  `,
      {
        headers: {
          authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );
  }
  postMessage(message: string) {
    this.slackClient.chat.postMessage({
      channel: this.channel,
      text: message,
      as_user: true,
      thread_ts: this.thread_ts,
    });
  }
}
