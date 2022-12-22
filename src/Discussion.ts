import { WebClient } from '@slack/web-api';
import axios from 'axios';
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
  _message?: string = '';
  _replies: DiscussionReply[] = [];
  _hasAnswer: boolean = false;
  _category?: string;
  _thread_ts?: string;

  constructor(
    private _ts: string,
    private _channelId: string,
    public responseUrl: string
  ) {}

  setTitle(title: string) {
    this._title = title;
  }
  get title(): string {
    return this._title ?? '';
  }
  setCategory(category: string) {
    this._category = category;
  }
  get category() {
    return this._category ?? '';
  }
  async parseReplies() {
    let response;
    try {
      response = await this.slackClient.conversations.history({
        channel: this._channelId,
        latest: this._ts,
        limit: 1,
        inclusive: true,
      });
    } catch (err) {
      throw new Error(
        "can't preserve this conversation since I am not a member of this channel. Please invite me using `/invite @Chan` first."
      );
    }

    if (!response.messages) return;
    this._message = response.messages[0]?.text;
    if (response.messages) this._thread_ts = response.messages[0].thread_ts;
    if (!this._thread_ts) return;
    const { messages } = await this.slackClient.conversations.replies({
      channel: this._channelId,
      ts: this._thread_ts,
    });
    if (!messages || messages.length === 0) {
      throw new Error(
        "The message that you are trying to preserve, doesn't have any replies so we can't preserve it."
      );
    }
    this._replies = messages.map((message: any) => {
      const isAnswer =
        message.reactions &&
        message.reactions.filter(
          (reaction: { name: string }) => reaction.name === 'white_check_mark'
        ).length > 0;
      if (isAnswer) {
        this._hasAnswer = true;
      }
      return { body: message.text, isAnswer, ts: message.ts };
    });
  }

  postMessage(message: string) {
    this.slackClient.chat.postMessage({
      channel: this._channelId,
      text: message,
      as_user: true,
      thread_ts: this._thread_ts,
      icon_url: 'https://avatars.githubusercontent.com/u/61865014',
    });
  }
}
