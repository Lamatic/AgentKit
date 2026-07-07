// Model config: Slack draft (LLMNode)
// Flow: draft-comms
//
// A capable chat model at a moderate temperature (~0.5) for natural, readable
// status-update prose. Higher than the diagnose node (which is 0) because this is
// writing, not ranking — but not so high that it starts embellishing beyond the
// evidence. Credentials blanked for sharing; set your own in Lamatic Studio.

export default {
  "generativeModelName": "@model-configs/draft-comms_slack.ts",
  "credentials": "@model-configs/draft-comms_slack.ts",
  "memories": "@model-configs/draft-comms_slack.ts",
  "messages": "@model-configs/draft-comms_slack.ts",
  "attachments": "@model-configs/draft-comms_slack.ts"
};
