/**
 * CEDA Innovation Hub - notification email worker
 *
 * Called by the ceda_queue_email database trigger (via pg_net) whenever a
 * notification row is created. Looks up the recipient, renders a branded
 * email, and hands it to the configured provider.
 *
 * Provider: Resend (https://resend.com) via RESEND_API_KEY.
 * Without a key the function logs the attempt as "skipped" and exits 200,
 * so the pipeline never breaks the app - in-app notifications keep working.
 *
 * Deploy:
 *   supabase secrets set RESEND_API_KEY=re_xxx
 *   supabase functions deploy send-notification-email --no-verify-jwt
 */
import { createClient } from 'https://esm.sh/@supabase-js@2@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = Deno.env.get('EMAIL_FROM') ?? 'CEDA Innovation Hub <notifications@ceda-hub.app>';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://ceda-hub.app';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const ICON = {
    gate: '&#9679;',
    evaluation: '&#9733;',
    assignment: '&#9998;',
    message: '&#9993;',
};

/**
 * The email template lives in the database (ceda_email_templates) so the
 * in-database sender and this function always produce identical mail.
 * We only render placeholders here.
 */
async function renderTemplate(type, title, body, link, siteUrl) {
    const { data: tpl } = await supabase
        .from('ceda_email_templates')
        .select('*')
        .eq('key', type || 'gate')
        .maybeSingle();
    if (!tpl) return null;

    const ctaLabel = type === 'evaluation' ? 'Read the feedback'
        : type === 'assignment' ? 'Open the submission'
        : type === 'message' ? 'Read and reply'
        : 'Open your submission';

    const html = tpl.html
        .replaceAll('{{title}}', title || '')
        .replaceAll('{{body}}', body || '')
        .replaceAll('{{eyebrow}}', tpl.eyebrow)
        .replaceAll('{{cta_label}}', ctaLabel)
        .replaceAll('{{cta_url}}', `${siteUrl}${link || '/participant'}`)
        .replaceAll('{{logo}}', `${siteUrl}/ceda-icon.png`)
        .replaceAll('{{site_url}}', siteUrl)
        .replaceAll('{{meta_block}}', '');

    const subject = (tpl.subject || '{{title}}').replaceAll('{{title}}', title || '');
    return { subject, html };
}

async function logEmail(notification_id, user_id, email, status, detail) {
    try {
        await supabase.from('ceda_email_log').insert({ notification_id, user_id, email, status, detail });
    } catch (_) { /* logging must never break delivery */ }
}

Deno.serve(async (req) => {
    try {
        const { notification_id } = await req.json();
        if (!notification_id) return new Response('notification_id required', { status: 400 });

        const { data: n } = await supabase
            .from('ceda_notifications')
            .select('*')
            .eq('id', notification_id)
            .maybeSingle();
        if (!n) return new Response('notification not found', { status: 404 });

        const { data: profile } = await supabase
            .from('ceda_profiles')
            .select('id, full_name, role, email_opt_in')
            .eq('id', n.user_id)
            .maybeSingle();

        if (!profile) return new Response('recipient profile not found', { status: 404 });

        const { data: userData } = await supabase.auth.admin.getUserById(n.user_id);
        const email = userData?.user?.email ?? null;

        const { data: settings } = await supabase.from('ceda_email_settings').select('*').eq('id', true).maybeSingle();
        const siteUrl = settings?.site_url || SITE_URL;
        const rendered = await renderTemplate(n.type, n.title, n.body, n.link, siteUrl);
        if (!rendered) {
            await logEmail(notification_id, n.user_id, email, 'skipped', 'no template for type ' + n.type);
            return new Response(JSON.stringify({ skipped: 'no-template' }), { status: 200 });
        }

        if (!email) {
            await logEmail(notification_id, n.user_id, null, 'skipped', 'no email on account');
            return new Response(JSON.stringify({ skipped: 'no-email' }), { status: 200 });
        }
        if (profile.email_opt_in === false) {
            await logEmail(notification_id, n.user_id, email, 'skipped', 'recipient opted out');
            return new Response(JSON.stringify({ skipped: 'opted-out' }), { status: 200 });
        }
        if (!RESEND_KEY) {
            await logEmail(notification_id, n.user_id, email, 'skipped', 'no email provider configured');
            return new Response(JSON.stringify({ skipped: 'no-provider' }), { status: 200 });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_KEY}`,
            },
            body: JSON.stringify({
                from: settings?.from_address || FROM,
                to: [email],
                subject: rendered.subject,
                html: rendered.html,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            await logEmail(notification_id, n.user_id, email, 'failed', `${res.status} ${errText.slice(0, 200)}`);
            return new Response(JSON.stringify({ failed: res.status }), { status: 500 });
        }

        await logEmail(notification_id, n.user_id, email, 'sent', 'delivered');
        return new Response(JSON.stringify({ sent: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
});
