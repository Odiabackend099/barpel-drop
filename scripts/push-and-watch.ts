/**
 * Push to GitHub and watch the CI/CD pipeline result in real time.
 *
 * Usage: npm run push "your commit message"
 *   (resolves to: tsx --env-file=.env.local scripts/push-and-watch.ts "your commit message")
 *
 * Requires GITHUB_TOKEN in .env.local with permissions:
 *   Actions: Read, Contents: Read+Write, Metadata: Read
 */

import { spawnSync } from 'child_process'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO_OWNER = 'Odiabackend099'
const REPO_NAME = 'barpel-drop'
const BRANCH = 'main'

const commitMessage = process.argv[2] ?? 'chore: update'

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN not set in .env.local')
  console.error('  Create one at github.com/settings/tokens (Fine-grained)')
  console.error('  Permissions: Actions: Read, Contents: Read+Write, Metadata: Read')
  console.error('  Add GITHUB_TOKEN=ghp_xxx to .env.local')
  process.exit(1)
}

async function githubApi(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  return res.json()
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

function elapsed(startMs: number): string {
  const s = Math.floor((Date.now() - startMs) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

function run(cmd: string, args: string[]): { ok: boolean; output: string } {
  const result = spawnSync(cmd, args, { encoding: 'utf-8' })
  const output = ((result.stdout ?? '') + (result.stderr ?? '')).trim()
  return { ok: result.status === 0, output }
}

async function main() {
  // ── Stage ──────────────────────────────────────────────────────
  console.log('\nStaging all changes...')
  const stageResult = run('git', ['add', '-A'])
  if (!stageResult.ok) {
    console.error('git add failed:', stageResult.output)
    process.exit(1)
  }

  const statusResult = run('git', ['status', '--porcelain'])
  const hasUncommitted = statusResult.output.trim().length > 0

  // ── Commit (if there is something to commit) ───────────────────
  if (hasUncommitted) {
    console.log(`Committing: "${commitMessage}"`)
    // Use args array — no shell interpolation, no injection risk
    const commitResult = run('git', ['commit', '-m', commitMessage])
    if (!commitResult.ok) {
      console.error('git commit failed:', commitResult.output)
      process.exit(1)
    }
  } else {
    console.log('Nothing to commit. Pushing existing HEAD...')
  }

  // ── Capture SHA before push so we can match the triggered run ──
  const shaResult = run('git', ['rev-parse', 'HEAD'])
  if (!shaResult.ok) {
    console.error('Could not read HEAD SHA:', shaResult.output)
    process.exit(1)
  }
  const commitSha = shaResult.output.trim()

  // ── Push ───────────────────────────────────────────────────────
  console.log('Pushing to GitHub...')
  const pushResult = run('git', ['push', 'origin', BRANCH])
  if (!pushResult.ok) {
    console.error('git push failed:', pushResult.output)
    process.exit(1)
  }
  console.log(`Pushed commit ${commitSha.slice(0, 7)}. Waiting for GitHub Actions...\n`)

  // ── Find the triggered run by SHA (not by timestamp) ──────────
  // SHA matching is reliable even when multiple pushes happen concurrently.
  let runId: number | null = null
  const detectStart = Date.now()

  while (!runId) {
    await sleep(4000)
    const runs = await githubApi(
      `/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?branch=${BRANCH}&per_page=10`
    )
    const match = (runs.workflow_runs ?? []).find(
      (r: { head_sha: string; id: number }) => r.head_sha === commitSha
    )
    if (match) {
      runId = match.id
      console.log(`Pipeline started (run #${runId})`)
      console.log(`  https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}\n`)
    }
    if (Date.now() - detectStart > 90_000) {
      console.error('Pipeline did not start within 90 seconds.')
      console.error(`Check: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`)
      process.exit(1)
    }
  }

  // ── Watch jobs in real time ─────────────────────────────────────
  const watchStart = Date.now()
  let lastPrint = ''
  let finalConclusion = ''

  while (true) {
    await sleep(8000)

    const [runData, jobsData] = await Promise.all([
      githubApi(`/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`),
      githubApi(`/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/jobs`),
    ])

    const jobs: Array<{
      id: number
      name: string
      status: string
      conclusion: string | null
      started_at: string | null
      completed_at: string | null
    }> = jobsData.jobs ?? []

    const overallStatus: string = runData.status
    const overallConclusion: string | null = runData.conclusion

    const lines: string[] = []
    lines.push(`\nPipeline running — ${elapsed(watchStart)} elapsed`)
    lines.push('─'.repeat(52))

    for (const job of jobs) {
      const icon =
        job.conclusion === 'success' ? 'PASS'
        : job.conclusion === 'failure' ? 'FAIL'
        : job.status === 'in_progress' ? 'WAIT'
        : job.status === 'queued' ? 'QUEUE'
        : 'SKIP'

      const duration =
        job.completed_at && job.started_at
          ? ` (${Math.round(
              (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000
            )}s)`
          : ''

      lines.push(`[${icon}]  ${job.name}${duration}`)

      // Show which step failed inside a failed job
      if (job.conclusion === 'failure') {
        const jobDetail = await githubApi(
          `/repos/${REPO_OWNER}/${REPO_NAME}/actions/jobs/${job.id}`
        )
        const failedSteps = (jobDetail.steps ?? []).filter(
          (s: { conclusion: string }) => s.conclusion === 'failure'
        )
        for (const step of failedSteps) {
          lines.push(`      Failed step: ${step.name}`)
        }
      }
    }

    const print = lines.join('\n')
    if (print !== lastPrint) {
      console.clear()
      console.log(print)
      lastPrint = print
    }

    if (overallStatus === 'completed') {
      finalConclusion = overallConclusion ?? 'unknown'
      break
    }

    // 15-minute safety timeout
    if (Date.now() - watchStart > 15 * 60_000) {
      console.log('\nPipeline is taking too long. Check GitHub Actions manually.')
      console.log(`  https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`)
      process.exit(1)
    }
  }

  // ── Final result ───────────────────────────────────────────────
  console.log('\n' + '═'.repeat(52))

  if (finalConclusion === 'success') {
    console.log('PIPELINE PASSED — DEPLOYED TO PRODUCTION')
    console.log('  https://dropship.barpel.ai is live')
    console.log(`  Total time: ${elapsed(watchStart)}`)
    process.exit(0)
  } else {
    console.log('PIPELINE FAILED — DEPLOY BLOCKED')
    console.log('  Production was NOT updated.')
    console.log(`  Failed after: ${elapsed(watchStart)}`)
    console.log(`  Full logs: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`)
    console.log('  Fix the errors above and run npm run push again.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Script error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
