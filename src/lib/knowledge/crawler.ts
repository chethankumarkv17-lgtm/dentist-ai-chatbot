/**
 * SSRF-Safe Dental Clinic Website Crawler
 * Complies with strict security policies: Blocks SSRF, private IPs, metadata endpoints, and non-HTTP protocols.
 */

export interface CrawlPageResult {
  url: string;
  title: string;
  cleanText: string;
  linksFound: string[];
  httpStatus: number;
}

export interface CrawlWebsiteResult {
  success: boolean;
  startUrl: string;
  pages: CrawlPageResult[];
  discoveredCount: number;
  warnings: string[];
  error?: string;
}

export interface CrawlerOptions {
  maxPages?: number;
  timeoutMs?: number;
  maxBytesPerPage?: number;
  rateLimitMs?: number;
}

const DEFAULT_OPTIONS: Required<CrawlerOptions> = {
  maxPages: 8,
  timeoutMs: 8000,
  maxBytesPerPage: 2 * 1024 * 1024, // 2MB
  rateLimitMs: 250,
};

/**
 * Evaluates whether a hostname or IP is a local, loopback, private, or cloud metadata address.
 */
export function isPrivateOrRestrictedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();

  // 1. Hostnames
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal' ||
    host === 'instance-data' ||
    host === '0.0.0.0'
  ) {
    return true;
  }

  // 2. IPv4 Checks
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ipv4Regex.exec(host);

  if (match) {
    const o1 = parseInt(match[1], 10);
    const o2 = parseInt(match[2], 10);
    const o3 = parseInt(match[3], 10);
    const o4 = parseInt(match[4], 10);

    // Validate byte ranges
    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return true;

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) return true;

    // 10.0.0.0/8 (Private)
    if (o1 === 10) return true;

    // 172.16.0.0/12 (Private)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (o1 === 192 && o2 === 168) return true;

    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata 169.254.169.254)
    if (o1 === 169 && o2 === 254) return true;

    // 0.0.0.0/8 (Current network)
    if (o1 === 0) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;
  }

  // 3. IPv6 Checks (Loopback ::1, Unique Local fc00::/7, Link-Local fe80::/10)
  if (
    host === '::1' ||
    host === '[::1]' ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80') ||
    host.startsWith('[fc') ||
    host.startsWith('[fd') ||
    host.startsWith('[fe80')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates whether a target URL is safe to crawl (Strict SSRF Prevention).
 */
export function validateSafeUrl(rawUrl: string): { isValid: boolean; normalizedUrl?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  const trimmed = rawUrl.trim();

  // Block dangerous pseudo-protocols before URL parsing
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('file:') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('ftp:')
  ) {
    return { isValid: false, error: 'Unsupported protocol scheme. Only HTTP and HTTPS are permitted.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed or unparseable URL format.' };
  }

  // Protocol check
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Invalid URL protocol. Only http:// and https:// are supported.' };
  }

  // Host verification
  if (!parsed.hostname || isPrivateOrRestrictedHost(parsed.hostname)) {
    return {
      isValid: false,
      error: 'Security Violation: Requests to internal network, localhost, or cloud metadata IPs are strictly forbidden (SSRF Prevention).',
    };
  }

  // Port check: Disallow non-standard service ports
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { isValid: false, error: 'Only standard HTTP (80) and HTTPS (443) ports are permitted.' };
  }

  // Clean trailing hash
  parsed.hash = '';

  return { isValid: true, normalizedUrl: parsed.toString() };
}

/**
 * Strips HTML noise, navigation, scripts, styles, and prompt injection patterns.
 */
export function cleanHtmlContent(html: string): { title: string; text: string } {
  if (!html) return { title: '', text: '' };

  // Extract <title>
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Remove scripts, styles, iframes, svgs, noscripts, navs, footers, headers, asides
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');

  // Convert break tags and block elements into newline separators
  cleaned = cleaned
    .replace(/<\/(h[1-6]|p|div|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Normalize whitespace & remove prompt injection delimiters
  const lines = cleaned
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && !line.includes('=== SYSTEM INSTRUCTIONS ==='));

  const text = lines.join('\n');

  return { title, text };
}

/**
 * Extracts same-origin hyperlink paths from HTML.
 */
export function extractSameOriginLinks(html: string, currentUrl: string, origin: string): string[] {
  const links: Set<string> = new Set();
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();

    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      rawHref.startsWith('javascript:')
    ) {
      continue;
    }

    try {
      const resolved = new URL(rawHref, currentUrl);

      // Must be same origin (same domain & protocol)
      if (resolved.origin.toLowerCase() === origin.toLowerCase()) {
        // Disallow media/file downloads
        const pathname = resolved.pathname.toLowerCase();
        if (
          !pathname.endsWith('.pdf') &&
          !pathname.endsWith('.jpg') &&
          !pathname.endsWith('.jpeg') &&
          !pathname.endsWith('.png') &&
          !pathname.endsWith('.gif') &&
          !pathname.endsWith('.zip') &&
          !pathname.endsWith('.css') &&
          !pathname.endsWith('.js')
        ) {
          resolved.hash = '';
          resolved.search = ''; // Strip query parameters to avoid duplicate crawling
          links.add(resolved.toString());
        }
      }
    } catch {
      // Ignore invalid hrefs
    }
  }

  return Array.from(links);
}

/**
 * Fetches and parses robots.txt for disallowed paths.
 */
export async function getRobotsDisallowedPaths(origin: string, timeoutMs: number = 3000): Promise<string[]> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RadiantNobel-DentalAI-Bot/1.0' },
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const text = await res.text();
    const disallowed: string[] = [];
    const lines = text.split('\n');

    let isRelevantAgent = true;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.substring(11).trim().toLowerCase();
        isRelevantAgent = agent === '*' || agent.includes('bot') || agent.includes('dental');
      } else if (isRelevantAgent && line.toLowerCase().startsWith('disallow:')) {
        const path = line.substring(9).trim();
        if (path) disallowed.push(path);
      }
    }

    return disallowed;
  } catch {
    return [];
  }
}

/**
 * Crawls a dental clinic's website starting from the homepage.
 */
export async function crawlWebsite(
  rawStartUrl: string,
  customOptions?: CrawlerOptions
): Promise<CrawlWebsiteResult> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  // 1. SSRF Validation
  const validation = validateSafeUrl(rawStartUrl);
  if (!validation.isValid || !validation.normalizedUrl) {
    return {
      success: false,
      startUrl: rawStartUrl,
      pages: [],
      discoveredCount: 0,
      warnings: [],
      error: validation.error || 'Invalid target website URL',
    };
  }

  const startUrl = validation.normalizedUrl;
  const origin = new URL(startUrl).origin;

  // 2. Robots.txt Check
  const disallowedPaths = await getRobotsDisallowedPaths(origin);

  const queue: string[] = [startUrl];
  const visited: Set<string> = new Set();
  const pages: CrawlPageResult[] = [];
  const warnings: string[] = [];

  while (queue.length > 0 && pages.length < options.maxPages) {
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    // Check against robots.txt disallow rules
    const urlPath = new URL(currentUrl).pathname;
    if (disallowedPaths.some((dis) => urlPath.startsWith(dis))) {
      warnings.push(`Skipped ${currentUrl} (disallowed by robots.txt)`);
      continue;
    }

    // Rate-limit pause
    if (pages.length > 0 && options.rateLimitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.rateLimitMs));
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs);

      const res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RadiantNobel-DentalAI-Bot/1.0 (+https://radiantnobel.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        warnings.push(`Page returned HTTP status ${res.status}: ${currentUrl}`);
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        continue; // Skip non-HTML documents
      }

      const rawHtml = await res.text();

      // Check max size
      if (rawHtml.length > options.maxBytesPerPage) {
        warnings.push(`Page exceeded max size limit (${options.maxBytesPerPage} bytes): ${currentUrl}`);
        continue;
      }

      const { title, text } = cleanHtmlContent(rawHtml);
      const links = extractSameOriginLinks(rawHtml, currentUrl, origin);

      // Prioritize useful clinic pages: services, dentists, team, about, contact, pricing, hours, faq
      const priorityKeywords = ['service', 'treatment', 'dentist', 'doctor', 'team', 'about', 'contact', 'price', 'fee', 'hour', 'faq', 'insurance', 'book'];

      links.forEach((link) => {
        if (!visited.has(link) && !queue.includes(link)) {
          const lowerLink = link.toLowerCase();
          const isPriority = priorityKeywords.some((kw) => lowerLink.includes(kw));
          if (isPriority) {
            queue.unshift(link); // Prioritize in front
          } else {
            queue.push(link);
          }
        }
      });

      pages.push({
        url: currentUrl,
        title: title || currentUrl,
        cleanText: text,
        linksFound: links,
        httpStatus: res.status,
      });
    } catch (err: unknown) {
      const isAbort = (err as Error)?.name === 'AbortError';
      warnings.push(
        isAbort ? `Timeout crawling ${currentUrl}` : `Failed to fetch ${currentUrl}: ${(err as Error)?.message}`
      );
    }
  }

  if (pages.length === 0) {
    return {
      success: false,
      startUrl,
      pages: [],
      discoveredCount: visited.size,
      warnings,
      error: 'Could not retrieve any accessible HTML pages from the provided website URL.',
    };
  }

  return {
    success: true,
    startUrl,
    pages,
    discoveredCount: visited.size + queue.length,
    warnings,
  };
}
