# Language Policy

## Default Language: English

All code, comments, documentation, and pull requests in this project must use **English** as the primary language.

## What Must Be in English

### Code and Comments
- **All code comments** - Function descriptions, inline comments, JSDoc documentation
- **Variable and function names** - Use clear, descriptive English names
- **Type definitions** - Interfaces, types, and their documentation
- **Error messages** - Exception messages and logging statements

### Documentation
- **README files** - Project documentation, setup instructions
- **Markdown documentation** - All `.md` files in the project
- **API documentation** - Endpoint descriptions, usage examples
- **Architecture documents** - Design decisions, technical specifications

### Development Communication
- **Pull request titles and descriptions** - Must be in English
- **Commit messages** - Follow Conventional Commits in English
- **Issue titles and descriptions** - Bug reports and feature requests in English
- **Code review comments** - All review feedback in English

## Exceptions

### User-Facing Content
- **UI text strings** - Should use i18n/localization libraries
- **User messages** - Handle via internationalization (i18n)
- **Locale-specific features** - Document in English, implement with i18n

### Examples of Allowed Non-English Content
```typescript
// ✅ Good - English comments, localized strings via i18n
const greeting = t('welcome.message'); // Uses i18n for UI text

// ❌ Bad - Japanese comments
// ユーザーにメッセージを表示
const greeting = 'ようこそ';
```

## Why English?

1. **Accessibility** - Makes the codebase accessible to international contributors
2. **Maintainability** - Ensures all team members can understand the code
3. **Industry Standard** - Aligns with open source and professional standards
4. **Collaboration** - Facilitates easier code reviews and discussions
5. **Documentation** - Technical resources are predominantly in English

## Enforcement

- **Pre-commit hooks** - May be added to detect non-English comments
- **Code reviews** - Reviewers should check for English-only content
- **CI/CD checks** - Automated checks may flag non-English content

## Transition Period

For existing code with non-English content:
1. Translate incrementally during normal maintenance
2. Prioritize high-traffic files and public APIs
3. Use translation tools while maintaining technical accuracy

## Questions?

If you're unsure whether something should be in English, default to using English. When in doubt, ask in a pull request or issue discussion.
