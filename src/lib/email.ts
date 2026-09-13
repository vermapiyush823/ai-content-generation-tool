import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'AI Content Factory <onboarding@resend.dev>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let resendClient: Resend | null = null;
if (resendApiKey && !resendApiKey.includes('placeholder')) {
  resendClient = new Resend(resendApiKey);
}

export interface SendDailyPackageEmailParams {
  to: string;
  date: string;
  channelsData: {
    channelName: string;
    genre: string;
    strategy: {
      objective: string;
      focus: string;
      avoid: string;
      experiment?: string;
      reason: string;
    };
    videos: {
      title: string;
      hook: string;
      script: string;
      scenes: {
        sceneNumber: number;
        duration: number;
        prompt: string;
      }[];
      caption?: string;
      cta?: string;
    }[];
  }[];
  insightsSummary?: string;
}

export async function sendDailyPackageEmail(params: SendDailyPackageEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { to, date, channelsData, insightsSummary } = params;

  const subject = `🎬 Your Daily Content Pack — ${date}`;

  // Build clean HTML template
  const channelsHtml = channelsData
    .map((ch) => {
      const videosHtml = ch.videos
        .map(
          (v, i) => `
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 18px; margin-bottom: 16px;">
          <div style="display: inline-block; background: #4f46e5; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
            VIDEO #${i + 1}
          </div>
          <h3 style="margin: 0 0 8px 0; color: #f4f4f5; font-size: 16px;">${v.title}</h3>
          
          <div style="background: #27272a; padding: 10px; border-left: 3px solid #ec4899; margin-bottom: 12px; font-size: 13px; color: #fbcfe8;">
            <strong>Hook:</strong> "${v.hook}"
          </div>

          <div style="margin-bottom: 12px;">
            <strong style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Script:</strong>
            <pre style="white-space: pre-wrap; font-family: inherit; font-size: 13px; color: #e4e4e7; background: #09090b; padding: 10px; border-radius: 6px; margin: 4px 0 0 0;">${v.script}</pre>
          </div>

          ${
            v.scenes?.length > 0
              ? `
            <div style="margin-top: 12px;">
              <strong style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">AI Video Prompts (${v.scenes.length} Scenes):</strong>
              ${v.scenes
                .map(
                  (sc) => `
                <div style="background: #09090b; border: 1px solid #27272a; padding: 8px; border-radius: 4px; margin-top: 6px; font-size: 12px;">
                  <span style="color: #818cf8; font-weight: bold;">Scene ${sc.sceneNumber} (${sc.duration}s):</span>
                  <div style="color: #d4d4d8; font-family: monospace; margin-top: 4px;">${sc.prompt}</div>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }

          ${
            v.caption
              ? `<div style="margin-top: 12px; font-size: 12px; color: #a1a1aa;"><strong>Caption:</strong> ${v.caption}</div>`
              : ''
          }
          ${
            v.cta
              ? `<div style="margin-top: 4px; font-size: 12px; color: #818cf8;"><strong>CTA:</strong> ${v.cta}</div>`
              : ''
          }
        </div>
      `
        )
        .join('');

      return `
      <div style="margin-bottom: 32px; border-top: 2px solid #3f3f46; padding-top: 20px;">
        <h2 style="color: #818cf8; margin: 0 0 4px 0; font-size: 20px;">CHANNEL: ${ch.channelName.toUpperCase()}</h2>
        <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Genre: ${ch.genre}</span>

        <div style="background: #1e1b4b; border-left: 4px solid #6366f1; padding: 12px; border-radius: 6px; margin: 14px 0 20px 0; font-size: 13px; color: #c7d2fe;">
          <strong style="display: block; font-size: 13px; color: #ffffff; margin-bottom: 4px;">Today's Strategic Directive</strong>
          <div><strong>Objective:</strong> ${ch.strategy.objective}</div>
          <div><strong>Focus:</strong> ${ch.strategy.focus}</div>
          <div><strong>Avoid:</strong> ${ch.strategy.avoid}</div>
          ${ch.strategy.experiment ? `<div><strong>Experiment:</strong> ${ch.strategy.experiment}</div>` : ''}
          <div style="margin-top: 4px; color: #a5b4fc; font-size: 12px;"><strong>Why:</strong> ${ch.strategy.reason}</div>
        </div>

        ${videosHtml}
      </div>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px 16px; margin: 0;">
        <div style="max-width: 640px; margin: 0 auto; background: #121215; border: 1px solid #27272a; border-radius: 12px; padding: 28px;">
          
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px;">
            <div>
              <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 4px 0;">AI Content Factory</h1>
              <p style="color: #a1a1aa; margin: 0; font-size: 13px;">Daily Content Package — ${date}</p>
            </div>
          </div>

          <!-- Open in Dashboard Button -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${appUrl}/dashboard" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              OPEN IN DASHBOARD
            </a>
          </div>

          ${channelsHtml}

          <!-- Footer -->
          <div style="border-top: 1px solid #27272a; padding-top: 20px; text-align: center; color: #71717a; font-size: 12px;">
            AI Content Factory • Automated Production System
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resendClient) {
    console.warn('RESEND_API_KEY is not configured. Email logged to console instead.');
    return {
      success: true,
      messageId: `simulated_${Date.now()}`,
    };
  }

  try {
    const data = await resendClient.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: data.data?.id,
    };
  } catch (err) {
    console.error('Resend error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Resend error',
    };
  }
}
