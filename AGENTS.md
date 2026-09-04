## Philosophy

Code is a tool to help humans accomplish tasks. Prioritize human understanding over machine efficiency.

- Favor explicitness over cleverness.
- complex systems are like aeroplanes: they are easy to fly when they work, but hard to fix when they break. Make the system easy to understand and debug.
- add features which have a clear definition of the usecase and a clear benefit to the user. Push back on features that are clever but have no clear benefit to the user.


## Hard Constraints

- Never run `db:migrate`. Migrations run on deployment or are applied manually by a human.
- Database writes require explicit user approval, even when using a local database.
- Never write tests against a real database. Use pglite in memory.
- Do not add `eslint-disable-line`; this project does not use ESLint.
- Target `main` for pull requests unless the user explicitly requests another base branch.
- whenever adding a user-visible UI feature, add or update a scenario which renders that bit of UI, render the updated UI, and include a newly captured screenshot in the response so that we can see how it looks like