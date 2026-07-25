export interface NotificationPayload {
  to: string; // email address, phone number, device token, webhook URL, etc. (channel-specific)
  title?: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Every channel (Email/SMS/Push/WhatsApp/Slack/Teams/Discord/Webhook) implements this. */
export interface NotificationChannel {
  readonly key: string;
  send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }>;
}
