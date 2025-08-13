import 'dotenv/config';
import { getSources } from './sources.js';
import { rankByHeuristics } from './rank.js';
import { summarizeBulk } from './summarize.js';
import { sendEmail } from './email.js';
import type { DigestConfig } from './types.js';

async function main() {
  const emailTo = process.env.DIGEST_TO || '';
  const emailFrom = process.env.DIGEST_FROM || '';
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!emailTo || !emailFrom || !smtpHost) {
    console.error('Missing email config. Set DIGEST_TO, DIGEST_FROM, SMTP_HOST, [SMTP_PORT], [SMTP_USER], [SMTP_PASS]');
    process.exit(1);
  }
  const cfg: DigestConfig = { emailTo, emailFrom, smtpHost, smtpPort, smtpUser, smtpPass };

  console.log('Fetching sources...');
  const articles = await getSources();
  console.log(`Collected ${articles.length} articles`);

  const ranked = rankByHeuristics(articles);
  const top = ranked.slice(0, 5);
  console.log('Summarizing top 5...');
  const summarized = await summarizeBulk(top);

  console.log('Sending email...');
  await sendEmail(cfg, summarized);
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
