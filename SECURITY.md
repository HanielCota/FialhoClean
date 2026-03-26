# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Fialho Optimizer, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@fialho.dev** (or open a private security advisory on GitHub).

### What to include

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Potential impact

### What to expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Fix or mitigation plan within 30 days for confirmed vulnerabilities

### Scope

The following are in scope:

- Command injection via IPC commands
- Path traversal in file operations
- Privilege escalation
- Arbitrary code execution
- Data exfiltration
- Bypass of service/task/app whitelists

The following are out of scope:

- Attacks requiring physical access to the machine
- Social engineering
- Denial of service against the local app
- Issues in upstream dependencies (report these to the upstream project)
