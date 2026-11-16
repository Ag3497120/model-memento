// The same frozen bilingual fixture also exercises the public cross entry point.
process.argv.push('--cross');
await import('../persona/era-voice-run.js');
