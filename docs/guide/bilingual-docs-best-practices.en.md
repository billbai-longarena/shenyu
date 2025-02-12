# Bilingual Documentation Best Practices [English] | [中文](bilingual-docs-best-practices.md)

This document summarizes the best practices and standards for maintaining bilingual documentation in the project.

## 1. Document Structure

### 1.1 File Naming Convention

- Chinese documents: `document-name.md`
- English documents: `document-name.en.md`
- Use lowercase letters and hyphens, avoid spaces and other special characters

### 1.2 Document Header Navigation

Each document should include language switching links in the header:

```markdown
# Document Title [English] | [中文](document-name.md)
```

## 2. Content Organization

### 2.1 Document Correspondence

- Each Chinese document should have a corresponding English version
- Maintain consistent directory structure across both language versions
- Ensure correct cross-references between documents

### 2.2 Content Synchronization

- Update both language versions promptly
- Maintain content consistency
- Keep code examples identical in both versions

## 3. README File Maintenance

### 3.1 Document References

When referencing documents in README, clearly indicate the language version:

```markdown
- [Document Title](docs/guide/document-name.en.md) [English]
```

### 3.2 Language Switching

- Keep README.md and README.en.md synchronized
- Ensure document links in each version point to the corresponding language version

## 4. Real Example

### 4.1 Adding New Documents

Steps for creating new documents:

1. Create Chinese version:
```bash
touch docs/guide/new-document.md
```

2. Create English version:
```bash
touch docs/guide/new-document.en.md
```

3. Add language switching links in both file headers:
```markdown
# Title [English] | [中文](new-document.md)
```
```markdown
# 标题 [中文] | [English](new-document.en.md)
```

### 4.2 Updating README

Add new document links in both README files:

```markdown
# README.md
- [文档标题](docs/guide/new-document.md) [中文]

# README.en.md
- [Document Title](docs/guide/new-document.en.md) [English]
```

## 5. Important Notes

### 5.1 Content Synchronization

- Update both language versions when modifying documents
- Use version control system branches to ensure simultaneous updates
- Include changes for both versions in PRs

### 5.2 Link Maintenance

- Regularly check cross-references between documents
- Ensure language switching links are correct
- Update all related references when changing file names

## 6. Summary

Key points for maintaining bilingual documentation:
1. Maintain clear file naming conventions
2. Ensure language switching links in document headers
3. Synchronize updates across language versions
4. Maintain correct document references
5. Regularly check and update document links
