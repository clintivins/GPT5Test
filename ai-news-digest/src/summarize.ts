import OpenAI from 'openai';
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import type { Article } from './types.js';

const MAX_INPUT_CHARS = 4000; // limit page text sent to the model

function stripHtml(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function naiveSummaries(items: Article[], maxChars: number): Promise<Article[]> {
  const out: Article[] = [];
  for (const it of items) {
    try {
      const res = await fetch(it.url, { headers: { 'user-agent': 'ai-news-digest/0.1' } });
      const text = await res.text();
      const clean = stripHtml(text);
      out.push({ ...it, summary: clean.slice(0, maxChars) + (clean.length > maxChars ? '…' : '') });
    } catch {
      out.push({ ...it, summary: undefined });
    }
  }
  return out;
}

export async function summarizeBulk(items: Article[], maxChars = 450): Promise<Article[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return naiveSummaries(items, maxChars);
  }
  const client = new OpenAI({ apiKey });
  const limit = pLimit(3);

  const results = await Promise.all(
    items.map((it) =>
      limit(async () => {
        try {
          const res = await fetch(it.url, { headers: { 'user-agent': 'ai-news-digest/0.1' } });
          const text = await res.text();
          const clean = stripHtml(text).slice(0, MAX_INPUT_CHARS);

          const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            max_tokens: 150,
            messages: [
              {
                role: 'system',
                content:
                  'You are a precise news summarizer. Summarize the article in 2–3 concise sentences, neutral tone, include key facts, numbers, and entities. No fluff, no emojis.',
              },
              {
                role: 'user',
                content: `Title: ${it.title}\nSource: ${it.source}\nContent: ${clean}\nTask: Provide a 2–3 sentence summary.`,
              },
            ],
          });

          const summary = completion.choices?.[0]?.message?.content?.trim();
          return { ...it, summary: summary ? summary.slice(0, maxChars) : undefined };
        } catch {
          return { ...it, summary: undefined };
        }
      }),
    ),
  );

  return results;
}
