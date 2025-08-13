import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import type { Article } from './types.js';

const parser = new XMLParser({ ignoreAttributes: false });
const limit = pLimit(6);

export async function fetchRss(url: string, source: string, max = 20): Promise<Article[]> {
  const res = await fetch(url, { headers: { 'user-agent': 'ai-news-digest/0.1' } });
  if (!res.ok) throw new Error(`Failed RSS ${source}: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const data = parser.parse(text);

  const items: any[] = data.rss?.channel?.item || data.feed?.entry || [];
  return items.slice(0, max).map((it) => ({
    title: it.title?.['#text'] ?? it.title ?? 'Untitled',
    url: it.link?.href ?? it.link?.['#text'] ?? it.link ?? it.guid ?? '',
    source,
    publishedAt: it.pubDate ?? it.published ?? it.updated,
  }));
}

export async function fetchHtml(url: string, source: string, selector: string, max = 20): Promise<Article[]> {
  const res = await fetch(url, { headers: { 'user-agent': 'ai-news-digest/0.1' } });
  if (!res.ok) throw new Error(`Failed HTML ${source}: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const out: Article[] = [];
  $(selector).each((_: number, el: cheerio.Element) => {
    const a = $(el).find('a').first();
    const title = a.text().trim() || $(el).text().trim();
    const href = a.attr('href') || '';
    if (title && href) out.push({ title, url: new URL(href, url).toString(), source });
  });
  return out.slice(0, max);
}

export async function getSources(): Promise<Article[]> {
  const sources: Array<Promise<Article[]>> = [
    // RSS feeds
    fetchRss('https://www.theverge.com/rss/artificial-intelligence/index.xml', 'The Verge AI'),
    fetchRss('https://feeds.arstechnica.com/arstechnica/technology-lab', 'Ars Technica AI'),
    fetchRss('https://www.reddit.com/r/MachineLearning/.rss', 'r/MachineLearning'),
    fetchRss('https://openai.com/blog/rss.xml', 'OpenAI Blog'),
    fetchRss('https://deepmind.google/atom.xml', 'Google DeepMind'),
    fetchRss('https://www.nature.com/subjects/machine-learning/rss', 'Nature ML'),
    // HTML pages
    fetchHtml('https://ai.googleblog.com', 'Google AI Blog', 'h2.entry-title'),
  ];

  const results = await Promise.allSettled(sources.map((fn) => limit(() => fn)));
  const articles: Article[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') articles.push(...r.value);
  }
  // Deduplicate by URL
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}
