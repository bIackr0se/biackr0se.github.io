---
title: "CVE-2026-58196: SSRF in ToolHive, host-side and past the sandbox"
date: 2026-06-26
description: "A remote MCP server can drive the ToolHive host into fetching internal URLs, reaching cloud instance metadata from outside the container isolation the tool is built to enforce."
tags: ["cve", "disclosure", "mcp", "ssrf"]
---

## The target

ToolHive (Stacklok) runs Model Context Protocol servers for you, each one in its own isolated container, behind an egress proxy, with no local credentials handed to it. The security model is explicit in the README: every MCP server is untrusted, so it stays boxed. That promise is the whole point of the tool.

Before a remote MCP server ever reaches its container, ToolHive runs OAuth discovery against it to work out how to authenticate. That discovery runs host-side, in the ToolHive process, outside the per-server sandbox. So the question is simple: does the untrusted server get to influence what the trusted host fetches during discovery?

It does.

## The finding

Discovery issues outbound HTTP GETs to URLs the remote MCP server controls, with no private-IP guard and no restriction on redirects. A server the victim added through the normal remote-server workflow can steer the host into fetching arbitrary internal addresses, including cloud instance metadata. The reach is exactly what the container sandbox is designed to deny, obtained from the one code path that runs before the sandbox.

The project already knows how to block this. It ships `ValidateRemoteURL`, which rejects internal IPs and hostnames for the configured remote URL, and `IsPrivateIP`, which blocks RFC1918, link-local, `169.254.0.0/16`, and loopback. The discovery clients call neither.

## The tell was in the suppressions

The three discovery requests each carry the maintainers' own `#nosec G704` comment. G704 is gosec's SSRF rule: it flags an HTTP request whose URL flows from external input, which is precisely this. Each suppression waves it off on the premise that the URL is "from internal config" or is "the MCP server endpoint."

That premise is the bug. Under ToolHive's own threat model the remote MCP server is untrusted, so "the MCP server endpoint" is attacker-controlled input, not internal config. The static analyzer found the exact issue and was told, in a comment, that the tainted value was trusted. A parallel cluster of log-injection suppressions on the same responses shows the whole path was treated as trusted, against the design.

## The chain

1. ToolHive GETs the remote server. The server answers `401` with `WWW-Authenticate: Bearer ... resource_metadata="<url>"`.
2. ToolHive fetches that server-supplied `resource_metadata` URL. There is an HTTPS check, but it runs once, on the initial URL only.
3. That client sets no redirect policy and no private-IP dialer, so it follows a `302 Location: http://169.254.169.254/...` to any scheme and any address, with no re-validation of the target.

The initial-URL HTTPS check is the kind of guard that looks sufficient and is not: an HTTPS metadata URL that answers with a `302` to an internal `http` address sails straight through it.

## Proof of concept

The attacker is the remote MCP server, never a URL the victim types. The victim runs a server they mean to use (`thv run <server> --remote-auth`); ToolHive does discovery automatically. The malicious server returns a `401` pointing `resource_metadata` at an HTTPS URL it owns, then `302`s that to `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>`. Reproduced against a loopback mock instance-metadata service standing in for the real endpoint; the code path is identical on a cloud instance.

## Impact, stated honestly

The proven primitive is: the host issues a GET to a server-controlled internal address and follows redirects with no filtering. On an instance with AWS IMDSv1 enabled, the request to `169.254.169.254` returns IAM credentials directly, since IMDSv1 answers a plain GET. IMDSv2 (token via `PUT` plus a header) and GCP (a required `Metadata-Flavor` header) are not reachable by a redirect-following GET, so on those the reachable surface is the broader internal-GET one: internal-only HTTP services, link-local and RFC1918 endpoints, and reachability or error oracles. Rated medium, CVSS 4.7.

## The fix

Apply the hardening the project already wrote for its DCR client to the discovery clients: reject cross-host and scheme-downgrade redirects, and wrap the dialer in the existing `IsPrivateIP` guard. The load-bearing part is re-validating the redirect target: the initial-URL scheme test only checks the first hop, so a `302` to an internal address slips past it. Fixed in v0.31.0; [advisory GHSA-pr64-jmmf-jp54](https://github.com/stacklok/toolhive/security/advisories/GHSA-pr64-jmmf-jp54).

## The lesson

A sandbox is only as strong as the code that runs outside it. Auth discovery, health checks, and update probes tend to run host-side and inherit none of the isolation the product advertises. And a `#nosec` with a confident rationale is worth reading twice: here the analyzer had already found the bug, and a trust assumption written in a comment overrode it.
