#!/usr/bin/env bun

import { $ } from "bun"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const webAppDir = join(import.meta.dir, "../web-app")
const poFile = join(webAppDir, "app/locales/cs.po")

// Run lingui extract first to get the latest strings
console.log("📦 Running lingui extract...")
await $`cd ${webAppDir} && pnpm lingui:extract`.quiet()

// Read and parse the PO file
const content = await readFile(poFile, "utf-8")

// Count missing translations (empty msgstr following a non-empty msgid)
// Exclude obsolete entries (starting with #~)
let missingCount = 0
const lines = content.split("\n")
let currentMsgid = ""

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Skip obsolete entries
  if (line.startsWith("#~")) continue

  // Match msgid lines
  const msgidMatch = line.match(/^msgid "(.+)"$/)
  if (msgidMatch) {
    currentMsgid = msgidMatch[1]
    continue
  }

  // Match empty msgstr lines
  if (line === 'msgstr ""' && currentMsgid !== "") {
    missingCount++
    currentMsgid = ""
  }
}

if (missingCount === 0) {
  console.log("✅ No missing Czech translations found.")
  process.exit(0)
}

console.log(`⚠️  Found ${missingCount} missing Czech translations in ${poFile}`)
console.log("🤖 Running Claude CLI to translate...")

const prompt = `Please translate the missing Czech translations in web-app/app/locales/cs.po.
Look for entries where msgstr is empty (msgstr "") and fill in the Czech translation.
Keep the same format, preserve any placeholders like {variable} or {count, plural, ...}.
The context is a sports event organizing web application called hraj.eu.
Only modify the msgstr lines that are empty, do not change anything else.`

// Run Claude CLI with haiku 4.5 model
const rootDir = join(import.meta.dir, "..")
const proc = Bun.spawn(["claude", "--model", "claude-haiku-4-5-20251001", "--dangerously-skip-permissions", "-p", prompt], {
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
})
await proc.exited

// Run lingui extract and compile
console.log("📦 Running lingui commands...")
await $`cd ${webAppDir} && pnpm lingui`

// Stage all changes
console.log("📝 Staging changes...")
await $`cd ${rootDir} && git add -A`

// Commit with i18n message
console.log("💾 Committing...")
await $`cd ${rootDir} && git commit -m "i18n" --no-verify`

console.log("✅ i18n translation commit completed!")
