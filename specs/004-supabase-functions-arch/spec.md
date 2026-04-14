# Feature Specification: Supabase Folder Architecture

**Feature Branch**: `004-supabase-functions-arch`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "Organize the architecture of folder /supabase to match of official documentation. Follows the exactly structure below: [Pasted Text: 16 lines] Use "fat functions". Develop few, large functions by combining related functionality. This minimizes cold starts. Name functions with hyphens (-). This is the most URL-friendly approach Store shared code in _shared. Store any shared code in a folder prefixed with an underscore (_). Separate tests. Use a separate folder for Unit Tests that includes the name of the function followed by a -test suffix."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardized Directory Structure (Priority: P1)

As a developer, I want the `/supabase/functions` directory structured according to the official documentation so that the codebase is predictable, maintainable, and aligned with best practices.

**Why this priority**: Correct foundational architecture prevents future technical debt and ensures standard tooling works as expected.

**Independent Test**: Can be fully tested by inspecting the directory tree of `/supabase/functions` and verifying that folder naming and test separation rules are strictly followed.

**Acceptance Scenarios**:

1. **Given** the `/supabase/functions` directory, **When** I look for shared utilities, **Then** I find them in a folder named `_shared` (or similarly prefixed with an underscore).
2. **Given** a function named `api-server`, **When** I look for its unit tests, **Then** I find them in an adjacent folder named `api-server-test`.

---

### User Story 2 - Fat Functions for Performance (Priority: P2)

As an API consumer, I want related API endpoints grouped into single "fat functions" so that I experience fewer cold starts and faster overall response times.

**Why this priority**: Minimizing cold starts directly improves perceived application performance for end users.

**Independent Test**: Can be tested by verifying that multiple related API routes (e.g., users, checklists, auth) are handled by a unified router within a single function rather than deployed as many individual micro-functions.

**Acceptance Scenarios**:

1. **Given** multiple related operations (e.g., CRUD for Checklists), **When** they are deployed, **Then** they exist within a single deployed Supabase Edge Function rather than separate functions.

---

### User Story 3 - URL-Friendly Function Names (Priority: P3)

As a developer, I want all function directories to be named using hyphens so that the resulting deployed URLs are standard, readable, and URL-friendly.

**Why this priority**: Ensures consistent API endpoint URLs across environments and follows web standards.

**Independent Test**: Can be tested by running a linter or manual check verifying that no function folder names contain underscores, camelCase, or spaces.

**Acceptance Scenarios**:

1. **Given** a new or existing function, **When** it is named in the filesystem, **Then** it exclusively uses lowercase letters and hyphens (e.g., `make-server`, not `makeServer` or `make_server`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All UI text and content MUST be in Brazilian Portuguese (pt-BR) (if applicable, though this feature focuses on backend architecture).
- **FR-002**: The system MUST combine related API endpoints into unified "fat functions" to minimize cold starts.
- **FR-003**: The system MUST enforce that all deployed function directory names use hyphens (`-`) exclusively (no camelCase or snake_case).
- **FR-004**: The system MUST store shared backend code (e.g., database clients, utility functions, type definitions) in a directory prefixed with an underscore, such as `_shared`, inside `/supabase/functions`.
- **FR-005**: The system MUST separate unit tests from the main function deployment directory.
- **FR-006**: The system MUST place unit tests in a dedicated folder whose name matches the target function followed by the `-test` suffix (e.g., tests for `my-func` go in `my-func-test`).

### Key Entities

- **Edge Function**: A deployed block of serverless code in Supabase. Must be a "fat function" routing multiple related requests.
- **Shared Code (`_shared`)**: Utilities and constants used by multiple Edge Functions.
- **Test Folder (`*-test`)**: A directory exclusively containing tests, preventing test dependencies from bloating the deployed function payload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of function folders in `/supabase/functions` use hyphenated naming.
- **SC-002**: 100% of unit tests reside in appropriately named `-test` suffix directories, completely outside the main function directories.
- **SC-003**: All shared utilities are imported from a `_shared` (or underscore-prefixed) directory rather than duplicated or relatively imported from other function folders.
- **SC-004**: The refactoring results in zero broken API endpoints (all existing tests pass and manual verification shows endpoints function normally).

## Assumptions

- The project uses Deno for Supabase Edge Functions, meaning imports from `_shared` will use Deno's relative path resolution or an `import_map.json`.
- Moving files and renaming directories will require updating existing import paths in the codebase.
- The existing `make-server-c4e14817` function is already serving as a "fat function" and primarily needs its shared files and tests reorganized.

### Edge Cases

- What happens if a function relies on a third-party module only used by itself? (It should remain inside the function's folder, not `_shared`).
- What happens if the `_shared` folder itself needs unit tests? (It should have a `_shared-test` folder alongside it).
