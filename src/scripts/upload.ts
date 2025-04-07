import { LeetcodeData } from '../types/LeetcodeData'
import { getHook, getStats, saveStats } from './storage'

async function getSHA(code: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(code)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}

async function uploadToGit(
    code: string,
    title: string,
    link: string,
    token: string,
    language: string,
    difficulty?: string,
    tags?: string[]
) {
    try {
        let stats = await getStats()
        const hook = await getHook()

        if (!hook) {
            throw new Error('No hook found')
        }

        const path = `${hook}/${title}.${language}`
        const message = `Add solution for ${title}${difficulty ? ` (${difficulty})` : ''}`
        const content = btoa(code)

        const response = await fetch(`https://api.github.com/repos/${hook}/contents/${path}`, {
            method: 'PUT',
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message,
                content,
                branch: 'main'
            })
        })

        if (!response.ok) {
            throw new Error(`Failed to upload: ${response.statusText}`)
        }

        // Update stats with new problem
        if (!stats) {
            console.log('No stats found, creating new stats object')
            stats = {
                version: '1.0.0',
                branches: {},
                submission: {},
                problems: {}
            }
        }

        console.log('Current stats before update:', stats)
        if (!stats.problems) {
            stats.problems = {}
        }
        stats.problems[title] = {
            id: Date.now(),
            title,
            difficulty: difficulty || 'Unknown',
            tags: tags || []
        }
        await saveStats(stats)
        console.log('Updated stats:', stats)

        // Verify update
        const updatedStats = await getStats()
        console.log('Verified stats from storage:', updatedStats)
    } catch (error) {
        console.error('Error uploading to Git:', error)
        throw error
    }
}

async function markUploadedCSS(branches: { [key: string]: string } | undefined, link: string) {
    if (!branches || typeof branches !== 'object') {
        console.warn('Invalid branches object:', branches)
        branches = {}
    }
    branches[link] = 'uploaded'
    const stats = await getStats()
    if (!stats) {
        console.warn('No stats found')
        return
    }
    stats.branches = branches
    await saveStats(stats)
}

export { getSHA, uploadToGit, markUploadedCSS } 