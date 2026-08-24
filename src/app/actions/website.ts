'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { websiteUrlSchema } from '@/lib/validations/website';
import { revalidatePath } from 'next/cache';

export async function verifyInstallation(widgetId: string, url: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = websiteUrlSchema.safeParse(url);
  if (!parsed.success) {
    return { success: false, error: 'Invalid URL for verification.' };
  }

  try {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 5000);

    const res = await fetch(url, { 
      signal: abortController.signal,
      headers: { 'User-Agent': 'DentalAI-Verification-Bot/1.0' }
    });
    
    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, error: 'Could not fetch website (Status: ' + res.status + ')' };
    }

    const html = await res.text();

    // Verification check: Does the HTML contain the widget ID AND a reference to our platform?
    const hasWidgetId = html.includes(widgetId);
    const hasScriptOrIframe = html.includes('widget.js') || html.includes('<iframe');

    if (hasWidgetId && hasScriptOrIframe) {
      // Real DB: UPDATE website_installations SET verified = true WHERE id = widgetId
      revalidatePath('/dashboard/website');
      return { success: true };
    }

    return { success: false, error: 'Widget snippet not found on the page. Please ensure you copied the code correctly.' };

  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Verification timed out. Is the website accessible?' };
    }
    return { success: false, error: 'Failed to connect to the website.' };
  }
}
