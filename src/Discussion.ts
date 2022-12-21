import { WebClient } from '@slack/web-api';
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
  _title?: string;
  message?: string = '';
  replies: DiscussionReply[] = [];
  hasAnswer: boolean = false;
  _category?: string;
  thread_ts?: string;

  constructor(private _ts: string, private _channelId: string) {}

  set title(title: string) {
    this._title = title;
  }
  get title(): string {
    return this._title ?? '';
  }
  set category(category: string) {
    this._category = category;
  }
  get category() {
    return this._category ?? '';
  }
  async parseReplies() {
    console.log(this._ts, this._channelId);
    const response = await this.slackClient.conversations.history({
      channel: this._channelId,
      latest: this._ts,
      limit: 1,
      inclusive: true,
    });
    if (!response.messages) return;
    this.message = response.messages[0]?.text;
    if (response.messages) this.thread_ts = response.messages[0].thread_ts;
    if (!this.thread_ts) return;
    const threadMessages = await this.slackClient.conversations.replies({
      channel: this._channelId,
      ts: this.thread_ts,
    });
    if (threadMessages.messages) {
      this.replies = threadMessages.messages.slice(1).map((message: any) => {
        const isAnswer =
          message.reactions &&
          message.reactions.filter(
            (reaction: { name: string }) => reaction.name === 'white_check_mark'
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

  postMessage(message: string) {
    this.slackClient.chat.postMessage({
      channel: this._channelId,
      text: message,
      as_user: true,
      thread_ts: this.thread_ts,
      icon_url: 'https://avatars.githubusercontent.com/u/61865014',
    });
  }
}
