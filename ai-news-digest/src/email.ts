import nodemailer from 'nodemailer';
import type { DigestConfig, Article } from './types.js';

export async function sendEmail(config: DigestConfig, top5: Article[]) {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure: (config.smtpPort ?? 587) === 465,
    auth: config.smtpUser && config.smtpPass ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  });

  const html = `
    <div>
      <h2>AI News Digest</h2>
      <ol>
        ${top5
          .map(
            (a) => `
          <li>
            <a href="${a.url}">${a.title}</a>
            <div><small>${a.source}${a.publishedAt ? ' • ' + a.publishedAt : ''}</small></div>
            ${a.summary ? `<p>${a.summary}</p>` : ''}
          </li>`,
          )
          .join('')}
      </ol>
    </div>`;

  await transporter.sendMail({
    from: config.emailFrom,
    to: config.emailTo,
    subject: 'Your AI News Top 5',
    html,
  });
}
