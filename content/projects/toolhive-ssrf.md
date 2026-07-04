---
title: "CVE-2026-58196: SSRF in ToolHive"
date: 2026-06-26
description: "Host-side SSRF in remote MCP server authentication discovery, bypassing container isolation."
tags: ["cve", "disclosure", "mcp"]
---

## Summary

ToolHive is Stacklok's runtime for deploying MCP servers in isolated containers. Its authentication discovery for remote MCP servers ran on the host, outside the container boundary the tool promises. A malicious or compromised remote MCP endpoint could steer that discovery step into server-side request forgery from the host process itself.

The point of running MCP servers in containers is that a hostile server stays boxed in. This bug moved the attacker's reach from the box to the machine running it.

## Outcome

```
[+] Reported through GitHub private vulnerability reporting
[+] Confirmed by maintainers, advisory GHSA-pr64-jmmf-jp54
[+] Fixed in ToolHive v0.31.0
[+] CVE-2026-58196 assigned, severity medium (4.7)
```

Full details in the [published advisory](https://github.com/stacklok/toolhive/security/advisories/GHSA-pr64-jmmf-jp54).

## Takeaway

Isolation claims are scoped to the code path that actually runs inside the sandbox. Auxiliary flows like auth discovery, health checks, and update probes often run on the host and inherit none of the isolation. When auditing container-based agent infrastructure, map which network calls happen on which side of the boundary before trusting the marketing diagram.
