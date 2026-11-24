# Prism engineering rules

- Keep Markdown/YAML records canonical; never duplicate record content in a view or cache.
- Use stable record identifiers. Paths and view-specific presentation are not record identity.
- All writes pass through validation and revision checks. Do not silently overwrite external edits.
- Preserve unknown metadata when evolving schemas; implement versioned migrations explicitly.
- Keep frontend state, server query results and durable project data separate.
- Favor accessible native controls, keyboard navigation, predictable focus and reduced motion.
- Build polished vertical slices. Do not introduce duplicate libraries or speculative abstractions.
- Use fictional demo content only. Never commit credentials or private game assets.
- Run typecheck, tests and production build before claiming a change is verified.
- Review dependency licenses before introducing dependencies. Do not assume commercial extensions are free.
- Keep application changes separate from user project data and never automatically push user data.
