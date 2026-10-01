---
name: release-views
description: Use when publishing a Rentennials MCP Apps views version or bumping rentennials-mcp-views in the consuming MCP server. Coordinates source tags, GitHub distribution tags, the manual Yarn 1 dependency bump, and deployment.
---

# Release Rentennials MCP views

Read the repository's CLAUDE.md and AGENTS.md. Confirm the workflow exists and
the build and checks are implemented before attempting a release. Ask for the
target X.Y.Z version and explicit permission for each Git write operation.
Never push, force-push, amend, rebase, or replace an existing tag in this task.

## 1. Prepare the source version

Check the working tree, current branch, intended diff, recent commits, package
version, and release checks. Check that every manifest entry has a unique
ui://rentennials/<view> URI, a corresponding self-contained HTML file, and CSP
with no connectDomains. Confirm fixtures and package contents contain no real
personal data, credentials, internal URLs, or environment-specific URLs.

After the user approves and commits the intended source, the user publishes
the source tag mcp-views-vX.Y.Z. Do not create or push a tag without permission.

## 2. Verify the distribution

The release-views workflow builds the views and creates an orphan distribution
commit containing only package.json and dist/ at the root. It publishes
mcp-views-dist-vX.Y.Z. The package name is rentennials-mcp-views, its version
matches X.Y.Z, and files is ["dist"]. manifest.json lives inside dist/.

Check the workflow result and distribution tree before changing a consumer.
Do not publish a source tag as the dependency: Yarn 1 cannot install a workspace
subdirectory from a Git dependency. Do not overwrite existing distribution tags.

## 3. Prepare the consuming server bump

Read the consuming repository's rules first. Ask permission to change its branch
or dependencies, and work only on the approved feature branch. Set its dependency:

```json
"rentennials-mcp-views": "git+https://github.com/Rentennials/ai-integrations.git#mcp-views-dist-vX.Y.Z"
```

Following the approved access-data-style bump procedure, remove only
node_modules/rentennials-mcp-views and yarn.lock. Leave yarn install to the user;
report the exact consumer and pending command. Never start or build the backend
locally. Do not commit consumer changes without separate permission.

## 4. Deploy and verify

The user installs dependencies, commits the regenerated lockfile, and deploys.
Check resources/list, resources/read, UI MIME type and CSP, tool resource links,
and the five views in ChatGPT and Claude. Refresh the connection and use a new
conversation after deployment. Keep unexecuted checks explicitly pending.
An updated views tag and server deployment do not require a new plugin ZIP.
