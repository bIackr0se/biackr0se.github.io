---
title: "I Built a $7 App in 25 Lines of Bash"
date: 2026-04-11
draft: false
description: "Someone is selling a clipboard cleaner for terminal users. Here's the free version."
tags: ["tools", "macos", "terminal"]
---

## The problem

You copy from the terminal. You paste into a doc, a tweet, a Slack message. It looks like garbage - trailing whitespace, phantom indentation, ANSI color codes rendered as `[0m` gibberish.

Someone built a macOS menu bar app that fixes this. $7.

## The fix

```bash
#!/bin/bash
# pasteclean - strip terminal formatting garbage from clipboard

text=$(pbpaste)

# Strip ANSI escape codes, trailing whitespace, trailing blank lines
cleaned=$(printf '%s' "$text" | \
  sed $'s/\x1b\\[[0-9;]*[a-zA-Z]//g' | \
  sed 's/[[:space:]]*$//' | \
  perl -0777 -pe 's/\n+\z/\n/')

# Dedent: use most common indent level, only strip spaces
indent=$(printf '%s' "$cleaned" | grep -v '^$' | sed 's/[^ 	].*//' | \
  awk '{ print length }' | sort | uniq -c | sort -rn | head -1 | awk '{ print $2 }')
if [ "${indent:-0}" -gt 0 ] 2>/dev/null; then
  cleaned=$(printf '%s' "$cleaned" | sed "s/^ \{1,$indent\}//")
fi

printf '%s\n' "$cleaned" | pbcopy
echo "Clipboard cleaned"
```

Save it somewhere in your `$PATH`, `chmod +x` it.

## Usage

Copy something from terminal. Run `pasteclean`. Paste clean.

For a hotkey, create a macOS Shortcut with a "Run Shell Script" action pointing to the script, then bind it to `Cmd+Shift+V` or whatever you like.

## What it does

- Strips ANSI escape codes (terminal colors/formatting)
- Removes trailing whitespace per line
- Removes trailing blank lines
- Dedents common leading indentation while preserving relative indent

The dedent uses mode (most frequent indent) instead of minimum. This handles the common case where one line starts at column 0 but everything else is indented - it strips the indentation without eating content.

## Before / After

```
Before:                            After:
    def hello():$                  def hello():
        print("world")  $             print("world")
        return True   $                return True


```

25 lines. $0. Works forever.
