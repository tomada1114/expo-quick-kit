# Contributing to expo-quick-kit

Thank you for your interest in contributing to expo-quick-kit! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `pnpm install`
3. **Run tests**: `pnpm test`
4. **Start development server**: `pnpm start`

## Development Guidelines

### Code Quality

Before submitting a pull request, ensure your code passes all checks:

```bash
# Run all quality checks
pnpm check

# Individual checks
pnpm format      # Format with Prettier
pnpm lint        # Lint with ESLint
pnpm typecheck   # TypeScript type checking
pnpm test        # Run Jest tests
```

### Language Policy

**All code, comments, and documentation must be in English.**

- ✅ **DO**: Write all code comments in English
- ✅ **DO**: Use English for commit messages and PR descriptions
- ✅ **DO**: Document functions and types in English
- ❌ **DON'T**: Use non-English text in code comments
- ❌ **DON'T**: Write commit messages in other languages

**Exception**: User-facing strings should use i18n/localization libraries.

See [.github/LANGUAGE_POLICY.md](.github/LANGUAGE_POLICY.md) for complete details.

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format in English:

```bash
feat: add dark mode support
fix: resolve navigation issue on Android
docs: update README with setup instructions
test: add tests for button component
refactor: simplify theme color logic
chore: update dependencies
```

**Format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks
- `style`: Code style changes (formatting)
- `perf`: Performance improvements

### Code Style

- **Naming**: Use `kebab-case` for file names: `button-component.tsx`
- **TypeScript**: Enable strict mode and fix all type errors
- **Formatting**: Prettier formats automatically (run `pnpm format`)
- **Linting**: Follow ESLint rules (run `pnpm lint:fix`)

### Testing

- Write tests for new features and bug fixes
- Place tests in `__tests__/` directories alongside code
- Test file naming: `component-name.test.tsx`
- Run tests before submitting PR: `pnpm test`

### Architecture

Follow the project structure:

```
app/                    # expo-router file-based routing
components/            # Shared UI components
features/             # Feature-based modules
database/             # Drizzle ORM setup
store/                # Zustand state management
lib/                  # Shared utilities
constants/            # Theme and constants
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture guidelines.

## Pull Request Process

### Before Submitting

1. ✅ Run `pnpm check` and ensure all checks pass
2. ✅ Write or update tests for your changes
3. ✅ Update documentation if needed
4. ✅ Ensure all code and comments are in English
5. ✅ Follow conventional commit format

### PR Guidelines

- **Title**: Use conventional commit format in English
  - Example: `feat: add authentication support`
- **Description**: Clearly explain what and why in English
  - What problem does this solve?
  - How does it work?
  - Any breaking changes?
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include if UI changes are involved

### Review Process

- Maintainers will review your PR
- Address feedback and comments
- Ensure CI/CD checks pass
- Once approved, a maintainer will merge

## Reporting Issues

When reporting bugs or requesting features:

1. **Use English** for title and description
2. **Search existing issues** first
3. **Provide context**:
   - What were you trying to do?
   - What happened instead?
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
4. **Include code samples** or error messages if applicable

## Questions?

- Open an issue for questions or discussions
- Check [CLAUDE.md](CLAUDE.md) for project-specific guidelines
- Review [.github/LANGUAGE_POLICY.md](.github/LANGUAGE_POLICY.md) for language requirements

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to expo-quick-kit!
