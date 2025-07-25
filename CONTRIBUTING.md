# Contributing to Cascade Thinking MCP

Thank you for your interest in contributing to the Cascade Thinking MCP project! This document provides guidelines and instructions for contributing.

## Code of Conduct

Just be nice! This means:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check existing issues to avoid duplicates
2. Use the issue search feature
3. Include as much detail as possible:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version)

### Suggesting Enhancements

We welcome suggestions! Please:
1. Check if the enhancement has already been suggested
2. Provide a clear use case
3. Explain why this enhancement would be useful
4. Consider if it aligns with the project's goals

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding standards** (see below)
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass** before submitting

#### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure your code passes all tests and linting (`npm run check`)
3. Request review from maintainers

Don't worry about updating CHANGELOG.md - I'll handle that during releases.

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/cascade-thinking-mcp.git
cd cascade-thinking-mcp

# Install dependencies
npm install

# Run tests in watch mode during development
npm run test:watch

# Before committing, run the full check
npm run check
```

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript settings (already configured)
- Avoid `any` types - use proper interfaces
- Prefer type guards over non-null assertions
- Document complex types with JSDoc comments

### Code Style

- Follow the existing code style
- ESLint configuration is enforced (no warnings allowed)
- Use meaningful variable and function names
- Keep functions focused and small
- Add comments for complex logic

### Testing Requirements

- The repo insists on 100% coverage. You can add ignores in the code for particularly difficult to test items.
- Write meaningful tests that test behavior, not implementation
- Use descriptive test names
- Group related tests with `describe` blocks
- Test edge cases and error conditions

### Commit Messages

Keep commit messages clear and descriptive. While conventional commits are nice, they're not required. Both of these styles are fine:

**Simple style** (perfectly acceptable):
```
Add branch numbering clarification
Fix type safety in tests
Update documentation
```

**Conventional style** (if you prefer):
```
feat(branching): add automatic sequence numbering
fix: improve error messages for branch creation
docs: update contributing guidelines
```

The main thing is that your commit message clearly describes what changed. Don't stress about the format!

## Project Structure

```
src/
├── index.ts                    # Entry point
├── types/                      # TypeScript interfaces
├── validators/                 # Input validation
├── formatters/                 # Output formatting
├── tools/                      # Tool configuration
├── services/                   # Core logic
└── server/                     # MCP server setup
```

### Important Files

- `CLAUDE.md` - Project documentation for Claude instances
- `tool-description.ts` - User-facing tool description (keep friendly tone!)
- Test files follow the pattern `*.test.ts`

## Running Commands

```bash
npm run check       # Run full validation (type, lint, test)
npm run build       # Build the project
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
npm run lint        # Check for linting issues
npm run lint:fix    # Auto-fix linting issues
npm run typecheck   # Type checking
```

## Areas for Contribution

I'd love help with:

1. **Additional Test Scenarios** - Edge cases and complex workflows
2. **Performance Optimizations** - For handling very large thought histories
3. **Documentation** - Tutorials, examples, and guides
4. **Integration Examples** - How to use with various AI frameworks
5. **Accessibility** - Improving output formatting for screen readers
6. **Bug Fixes** - If you find something broken, please fix it!

## Questions?

If you have questions about contributing:
1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Reach out to maintainers

## Recognition

Contributors will be recognized in:
- The project README
- Release notes for their contributions
- Special thanks in relevant documentation

Thank you for helping make Cascade Thinking MCP better! 🚀