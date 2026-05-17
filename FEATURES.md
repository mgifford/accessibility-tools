# Accessibility Tools Feature Overview

## Purpose

This document describes the technical capabilities of Accessibility Tools and explains how the product extends beyond a standalone axe-based scanner.

At its core, the application uses `axe-core` as one input into a larger accessibility testing and audit workflow. The repository implements additional layers for test orchestration, manual review, landmark classification, remediation management, and formal reporting.

## Architecture Summary

Accessibility Tools is an Electron application with:

- a Next.js / React user interface
- a Node.js / Electron runtime for test execution
- a SQLite database managed through Sequelize
- a system data layer that defines built-in standards, test cases, remediations, audit structures, landmarks, and axe rule mappings

The primary automated test flow is implemented in:

- `src/electron/lib/testRunner.js`
- `src/electron/lib/axecore.js`
- `src/electron/lib/landmarkRunner.js`
- `src/electron/db/systemData.json`

## What axe-core Provides in This System

`axe-core` is used to:

1. inject the axe runtime into an off-screen Electron `BrowserWindow`
2. execute `axe.run()` against a loaded page
3. collect `violations`, `passes`, and `incomplete` results
4. map those results to application-level test cases through stored axe rule associations
5. persist node-level targets, selectors, HTML snippets, summaries, and statuses for later review

This is an important capability, but it is only one layer of the product.

## How Accessibility Tools Goes Beyond an axe Scanner

### 1. Built-in manual testing workflow

The system contains a mixed test catalog, not only automated rules.

Current built-in data includes:

- 133 total test cases
- 36 `AUTOMATIC` test cases
- 97 `MANUAL` test cases

Manual test cases are stored as first-class records with:

- step-by-step instructions
- expected result text
- target selectors
- WCAG criteria mappings
- status tracking in the same workflow as automated findings

When a page is tested, `TestRunner` identifies the target DOM elements for manual checks and stores them with a `MANUAL` status so a human reviewer can inspect them later.

This is materially different from axe alone. axe can report only what can be inferred algorithmically from the DOM and computed styles. It cannot decide many conformance questions that require human judgment, such as:

- whether captions accurately reflect speech and meaningful sounds
- whether images or background images convey essential meaning
- whether structure remains meaningful when presentation is removed
- whether instructions are understandable in context
- whether content changes are appropriate for users with cognitive or sensory disabilities

### 2. Application-level test model above raw axe rules

Accessibility Tools does not surface raw axe output as an isolated scan report.

Instead, it defines persistent test cases that can be associated with:

- one or more axe rules
- WCAG criteria
- remediations
- categories
- standards

This creates a stable domain model for accessibility work. The product can track accessibility findings as named test cases rather than as transient scanner output only.

### 3. Landmark classification and structural context

After test execution, `LandmarkRunner` post-processes stored targets and attempts to map them to semantic landmark regions such as:

- `header`
- `nav`
- `main`
- `aside`
- `section`
- `footer`
- ARIA roles such as `banner`, `navigation`, `main`, `search`, and `contentinfo`

The repository currently defines 11 built-in landmark types.

This produces structural context that a basic axe scanner does not normally provide as part of a broader audit workflow:

- whether a failing node is itself a landmark
- whether it is contained inside a landmark
- which landmark region should own or review the issue

That extra context is useful for remediation, reporting, and assigning ownership.

### 4. Formal audit frameworks, not just scan output

The application supports audit generation for:

- `WCAG-EM`
- `ATAG`
- `VPAT`

For VPAT, the repository includes multiple versions:

- VPAT 2.5 Rev EU
- VPAT 2.5 INT
- VPAT 2.5 508
- VPAT 2.5 WCAG

This is a major distinction from an axe scanner.

An axe scan identifies technical findings. It does not by itself produce a full conformance assessment artifact aligned to procurement or audit frameworks. Accessibility Tools adds the data structures and report generation needed to build those artifacts across different scopes such as web, software, documentation, and authoring tools.

### 5. Remediation catalog and default remediation assignment

The repository contains a remediation layer with 319 built-in remediation records.

Failed targets can be associated with remediations so the platform stores more than defect detection. It also stores corrective guidance and ties that guidance to test cases and targets. The axe integration in `axecore.js` assigns default remediations to failed nodes when a mapped remediation exists.

This is beyond what a standard axe scanner typically offers, where output is primarily rule-centric rather than workflow-centric.

### 6. Persistent project, environment, and page testing model

The product organizes work around:

- projects
- environments
- environment pages
- structured and random page sets
- environment tests
- page-level execution status

The test runner iterates across selected pages, tracks start and end times, handles timeouts, emits progress events, and aggregates occurrence data.

This enables repeatable multi-page testing campaigns instead of one-off page scans.

### 7. Human review states and incomplete-result handling

The platform supports statuses such as:

- `PASS`
- `FAIL`
- `INCOMPLETE`
- `MANUAL`

That distinction matters because accessibility evaluation is not fully binary. Some results require confirmation, and some tests are intentionally manual. The product models those states explicitly in storage and UI workflows.

### 8. Multiple export and reporting targets

The reporting layer supports:

- PDF output
- HTML output
- JSON output

This allows the same underlying findings and audit data to be reused for internal review, formal reporting, and downstream integrations.

## Comparison with a Basic axe Scanner

| Capability | Basic axe scanner | Accessibility Tools |
| --- | --- | --- |
| Run automated axe rules | Yes | Yes |
| Persist results in a multi-entity audit database | No | Yes |
| Built-in manual test catalog | No | Yes |
| Human review workflow for manual targets | No | Yes |
| Link findings to WCAG criteria and named test cases | Limited | Yes |
| Landmark ownership and structural context | Limited | Yes |
| Remediation catalog and assignment | Limited | Yes |
| Multi-page project/environment orchestration | Limited | Yes |
| WCAG-EM report support | No | Yes |
| ATAG audit support | No | Yes |
| VPAT generation support | No | Yes |
| Export as PDF / HTML / JSON | Varies | Yes |

## Practical Interpretation

If a tool only runs axe and shows rule violations, it is primarily an automated scanner.

Accessibility Tools is broader. It combines:

- automated rule execution
- manual review preparation
- structured accessibility test case management
- landmark-aware result enrichment
- remediation tracking
- audit and conformance reporting

Technically, the application should be understood as an accessibility testing and audit platform that uses axe-core as one subsystem, not as a thin wrapper around axe.

## Current Built-in Data Snapshot

As represented in `src/electron/db/systemData.json`, the repository currently includes:

- 133 test cases
- 100 axe rules
- 319 remediations
- 11 landmark definitions
- 3 audit types
- 4 VPAT variants
- WCAG standards data through versions 2.0, 2.1, and 2.2

These built-in assets are part of what makes the platform more than a scanner: they define the accessibility domain model that surrounds and extends raw axe execution.
