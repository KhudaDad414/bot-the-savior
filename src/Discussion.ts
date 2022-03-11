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
  channel: any;
  title: string;
  thread_ts: string;
  body: string = '';
  replies: DiscussionReply[] = [];
  hasAnswer: boolean = false;
  botId: string;
  category: string;

  constructor(event: Event) {
    const [bot_id, , title, category]: string[] = splitargs(event.text);
    this.category = category?.toLowerCase() || 'q&a';
    if (this.category === 'q&amp;a') this.category = 'q&a';
    this.channel = event.channel;
    this.title = title;
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
  postMessage(message: string) {
    this.slackClient.chat.postMessage({
      channel: this.channel,
      text: message,
      as_user: true,
      thread_ts: this.thread_ts,
      icon_url: 'https://avatars.githubusercontent.com/u/61865014',
    });
  }
}
