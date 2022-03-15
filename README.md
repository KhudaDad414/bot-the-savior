# Bot The Saviour
A slack bot that will help you save your slack discussions as GitHub discussion in a repo.


- [Getting Started](#getting-started)
  * [Create A Slack App](#create-a-slack-app)
  * [Host This app](#host-this-app)
  * [Update the request_url in App Manifest](#update-the-request-url-in-app-manifest)
- [How to use](#how-to-use)
  * [Save discussion](#save-discussion)

## Getting Started
If you want to use this bot in your slack workspace follow the following steps:
### Create A Slack App
This app will work as the backend for your bot, so you first need to create a slack app and give it the appropriat permissions.
Your slack bot should have the following permissions:

```yaml
      - chat:write
      - app_mentions:read
      - channels:history
```
and it needs to subscribe to `app_mention` event.

Your `App Manifest` should look something like this:
```yaml
display_information:
  name: BotTheSavior
  description: store your messages to github discussions from slack.
  background_color: "#0000AA"
features:
  bot_user:
    display_name: Chan
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - app_mentions:read
      - channels:history
settings:
  event_subscriptions:
    request_url: https://YOUR_APP_URL/slack/events
    bot_events:
      - app_mention
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```
### Host This app
Host this node app somewhere with the following Environment Variables:
| Name | Explaination |
| --- | --- |
| SLACK_SIGNING_SECRET | You can get your Slack Signing Secret from your Slack App in the following location: `Settings -> Basic Info -> App Credentials`. |
| SLACK_TOKEN | For getting your slack Token, you need to install your Slack App in a Workspace. go to `Settings -> Install App` install the app in one of your workspaces and the this token will appear in `Settings -> Install App` page. | |
| GITHUB_TOKEN | this token needs to have the permission to create discussions in your repo. |
| REPO_OWNER | the owner of the github repository for saving the discussions |
| REPO_NAME | the name of the github repository for saving the discussions |

### Update the request_url in App Manifest
```yaml
request_url: https://CURRENT_APP_DOMAIN_OR_IP_ADDRESS/slack/events
```

## How to use
The app will respond only if you mention it in a thread. so your command should look like this: `@Chan help`.
### Save discussion

- Synctax: `@Chan save <discussion_title> [discussion_category]`
- discussion_title: the title of the discussion that should be saved in github discussions. (mandatory)
- discussion_category : the category of discussion in github. (default: Q&A).
