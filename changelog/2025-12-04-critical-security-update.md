---
date: 2025-12-04
title: "Critical Security Update"
tags: [Security]
---

Sitepins has been updated to address the **React2Shell (CVE-2025-55182)** vulnerability.

Because Sitepins is built with Next.js, we prioritized updating our core application to the latest patched version of the framework. This ensures our infrastructure and your projects remain protected.

**Why this update was necessary:** A critical vulnerability was identified in how React Server Components (RSC) process data. Without this patch, unauthenticated attackers could execute remote code on the server.

**Current Status:** The update has been successfully deployed. No action required on your part — Sitepins is now fully secured against this vulnerability.