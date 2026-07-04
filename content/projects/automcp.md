---
title: "AutoMCP: Elastic Purple Team MCP Server"
date: 2026-04-04
description: "An MCP server that extracts security alerts from Elastic, analyzes them, responds, and runs counter-reconnaissance."
tags: ["tool", "mcp", "detection"]
---

## What it is

AutoMCP is an MCP server built on LangGraph that plugs LLM agents into an Elastic SIEM. It pulls security alerts, triages them, drives response actions, and performs counter-reconnaissance against the source of an attack.

## Why it exists

Alert triage is the part of detection engineering that burns analysts out. The interesting question is how far an agent can go past summarizing an alert: pivoting on it, enriching it, and acting on it, while staying inside guardrails a SOC would accept.

## Where to get it

Source and setup instructions on [GitHub](https://github.com/bIackr0se/AutoMCP).
