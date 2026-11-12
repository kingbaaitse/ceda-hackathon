/**
 * Copy the chosen illustrations into the app and recolour them into the CEDA
 * palette, so the artwork reads as ours rather than as stock.
 *
 *   node tools/prepare-illustrations.mjs
 *
 * Source: the undraw set in the user's Downloads folder.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const DOWNLOADS = path.join(os.homedir(), 'Downloads');
const OUT = path.resolve('src/assets/img/illustrations');

/* The artwork we want beside the headline, and what each one means here. */
const WANTED = [
    { file: 'undraw_winner_x40e.svg', name: 'winner.svg' },
    { file: 'undraw_idea-to-plan_jnei.svg', name: 'idea-to-plan.svg' },
    { file: 'undraw_business-pitch_h9yw.svg', name: 'pitch.svg' },
    { file: 'undraw_grading-papers_7fpu.svg', name: 'judging.svg' },
    { file: 'undraw_team_mmq0.svg', name: 'team.svg' },
    { file: 'undraw_co-workers_adrr.svg', name: 'co-workers.svg' },
    { file: 'undraw_profile_9xdn.svg', name: 'profile.svg' },
    { file: 'undraw_upload-in-progress_i3q9.svg', name: 'upload.svg' },
    { file: 'undraw_detailed-answer_kys9.svg', name: 'feedback.svg' },
    { file: 'undraw_organizing-work_gmo9.svg', name: 'organising.svg' },
    { file: 'undraw_shared-goals_ijlg.svg', name: 'shared-goals.svg' },
    { file: 'undraw_decision-point_yhu3.svg', name: 'decision.svg' },
    { file: 'undraw_startup-growth_2sgm.svg', name: 'growth.svg' },
    { file: 'undraw_dashboard_86u3.svg', name: 'dashboard.svg' },
    { file: 'undraw_document-review_lfir.svg', name: 'review.svg' },
    { file: 'undraw_idea-process_2at3.svg', name: 'idea-process.svg' },
    { file: 'undraw_ux-design_dpqq.svg', name: 'design.svg' },
    { file: 'undraw_random-idea_a29k.svg', name: 'random-idea.svg' },
    { file: 'undraw_garden-harvest_r6yu.svg', name: 'harvest.svg' },
    { file: 'undraw_happy-news_6lg3.svg', name: 'happy-news.svg' },
    { file: 'undraw_protection-enabled_pve7.svg', name: 'secure.svg' },
    { file: 'undraw_mobile-app_aftb.svg', name: 'mobile.svg' },
    { file: 'undraw_project-flow_ghph.svg', name: 'flow.svg' },
];

/* undraw palette -> CEDA palette */
const RECOLOUR = {
    '090814': '241F1B',
    '2f2e41': '241F1B',
    '3f3d56': '3A342E',
    '192534': '241F1B',
    'b6b3c5': 'C9C0B4',
    'f59e0b': 'F26522',
    'ed9da0': 'FAA61A',
    '9f616a': 'C86A5E',
    'd6d6e3': 'E4DED4',
    'e6e6e6': 'EFEBE4',
    'e5e5e5': 'EFEBE4',
    'f2f2f2': 'F7F4F0',
    '010001': '241F1B',
};

const run = async () => {
    await mkdir(OUT, { recursive: true });
    let copied = 0;
    for (const item of WANTED) {
        const src = path.join(DOWNLOADS, item.file);
        try {
            await access(src);
        } catch {
            console.log(`- ${item.name} (not found)`);
            continue;
        }
        let svg = await readFile(src, 'utf8');
        for (const [from, to] of Object.entries(RECOLOUR)) {
            svg = svg.replaceAll(`#${from}`, `#${to}`);
        }
        await writeFile(path.join(OUT, item.name), svg, 'utf8');
        copied++;
    }
    console.log(`✓ ${copied} illustrations in ${path.relative(path.resolve('.'), OUT)}`);
};

run();
