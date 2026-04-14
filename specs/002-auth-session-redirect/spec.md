# Feature Specification: Authentication Session Redirect

**Feature Branch**: `002-auth-session-redirect`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "Criar uma regra de negócio para redirecionar para a página de login sempre que a sessão de usuário expirar, ou não for válida."

## Clarifications

### Session 2026-04-10
- Q: Onde a validação de sessão deve ocorrer? → A: Ambos: Interceptador de Resposta API e Guard de Rota UI

- Q: Como tratar múltiplas falhas de API simultâneas por expiração? → A: Redirecionar apenas uma vez (Singleton redirect)

- Q: Como a mensagem de redirecionamento deve ser transmitida? → A: Parâmetro na URL (ex: ?reason=expired)

- Q: Como a expiração inativa deve ser tratada? → A: Usar estritamente a vida útil nativa do token JWT/sessão do Supabase


- Q: Onde o token de sessão deve ser armazenado? → A: Cookies HttpOnly (Mais seguro, bloqueia acesso via JS)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Redirect on Expired Session (Priority: P1)

As a system user, I want to be redirected to the login page when my session expires so that my account remains secure and I am aware I need to authenticate again.

**Why this priority**: It is a critical security requirement to prevent unauthorized access from stale sessions.

**Independent Test**: Can be fully tested by simulating an expired session on a protected page and verifying that the user is immediately redirected to the login screen.

**Acceptance Scenarios**:

1. **Given** I am logged into the application and my session expires due to inactivity or time limit, **When** I attempt to load or interact with a protected page, **Then** I am immediately redirected to the login page.

---

### User Story 2 - Redirect on Invalid Session (Priority: P2)

As a system user, I want the system to block access and redirect me to login if my session token is missing or tampered with, ensuring data protection.

**Why this priority**: Essential for preventing unauthorized access via direct URL manipulation or invalid session tokens.

**Independent Test**: Can be tested by attempting to access a protected URL directly without an active session or with a manually altered session token.

**Acceptance Scenarios**:

1. **Given** I do not have a valid active session, **When** I try to navigate directly to a protected route (e.g., dashboard), **Then** I am redirected to the login page.
2. **Given** I have a tampered or unrecognized session token, **When** I access the application, **Then** my access is denied and I am redirected to the login page.

---

### User Story 3 - Feedback Upon Redirect (Priority: P3)

As a system user, I want to see a clear message when I am redirected to the login page so that I understand my session expired and there isn't a system error.

**Why this priority**: Greatly improves user experience by avoiding confusion regarding sudden logouts.

**Independent Test**: Can be tested by forcing a session expiration redirect and verifying that an appropriate alert/message is visible on the login page.

**Acceptance Scenarios**:

1. **Given** I am redirected to the login page due to an expired or invalid session, **When** the login page loads, **Then** I see a friendly message explaining that I need to log in again.

---

### Edge Cases

- What happens if a user is already on a public page (e.g., the login or signup page) and their session expires? (They should remain on the page without redirect loops).
- What happens if multiple API requests are fired simultaneously just as the session expires? (The system should handle it gracefully without crashing or causing multiple redirects).

## Requirements *(mandatory)*

### Functional Requirements
- **FR-010**: O sistema DEVE validar a sessão tanto preventivamente (antes de carregar rotas protegidas) quanto reativamente (interceptando erros 401/403 de chamadas de API).
- **FR-009**: O sistema DEVE implementar um mecanismo de "Singleton Redirect" para garantir que apenas um redirecionamento ocorra mesmo se múltiplas chamadas de API falharem simultaneamente por falta de sessão.
- **FR-008**: O motivo do redirecionamento DEVE ser passado via parâmetro de consulta na URL (query parameter) para a página de login.
- **FR-007**: A verificação de expiração DEVE respeitar estritamente o tempo de vida nativo do token JWT fornecido pelo Supabase Auth (sem timeout de ociosidade no cliente).
- **FR-006**: O token de sessão DEVE ser armazenado utilizando Cookies HttpOnly, em conformidade com as diretrizes de segurança, visando mitigar vulnerabilidades XSS.

- **FR-001**: All UI text and content MUST be in Brazilian Portuguese (pt-BR).
- **FR-002**: System MUST verify the session's validity (existence and expiration) upon accessing any protected page or resource.
- **FR-003**: System MUST redirect the user to the login page immediately upon detecting that the current session is expired or invalid.
- **FR-004**: System MUST display a clear, localized message on the login page explaining the reason for the redirect (e.g., "Sua sessão expirou. Por favor, faça login novamente.").
- **FR-005**: System MUST NOT apply this redirect logic to public pages (e.g., login, registration) to prevent redirect loops.

### Key Entities *(include if feature involves data)*

- **Session**: Represents the user's active state in the application, including its validity status and expiration time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempts to access protected routes without a valid session successfully redirect the user to the login page.
- **SC-002**: Users receive visual feedback on the login page within 1 second of being redirected due to session issues.
- **SC-003**: Zero infinite redirect loops occur when accessing public pages with an invalid session.

## Assumptions

- **Existing Authentication**: An authentication system is already in place and provides a mechanism to check if a user is logged in and if their session is valid.
- **Protected vs Public Routes**: There is a clear distinction in the application between routes that require authentication and those that do not.
