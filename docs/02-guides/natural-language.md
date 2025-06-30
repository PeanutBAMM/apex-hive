# Natural Language Guide

Apex Hive understands natural language commands in both English and Dutch. This guide shows you how to use conversational commands instead of memorizing specific syntax.

## 🌍 Supported Languages

- **English** - Full support for natural commands
- **Dutch (Nederlands)** - Complete Nederlandse ondersteuning

## 💬 How It Works

The natural language processor:
1. Analyzes your input for intent
2. Matches against known patterns
3. Executes the appropriate command or recipe
4. Falls back to fuzzy matching if needed

## 📝 English Examples

### CI/CD Tasks
```bash
# Instead of: apex ci:fix
apex "fix the CI"
apex "CI is broken"
apex "repair the build"

# Instead of: apex ci:status  
apex "what's the CI status?"
apex "check build status"
apex "show CI health"
```javascript

## Documentation
```bash
# Instead of: apex doc:generate
apex "generate documentation"
apex "create docs"
apex "write documentation"

# Instead of: apex doc:fix-links
apex "fix broken links"
apex "repair documentation links"
```javascript

## Code Quality
```bash
# Instead of: apex quality:fix-all
apex "fix all code issues"
apex "clean up the code"
apex "format everything"

# Instead of: apex quality:console-clean
apex "remove console logs"
apex "clean console statements"
```javascript

## Git Operations
```bash
# Instead of: apex git:commit && apex git:push
apex "commit and push"
apex "save and upload changes"
apex "commit everything and push"
```javascript

## Search
```bash
# Instead of: apex search "auth"
apex "find authentication code"
apex "search for auth functions"
apex "where is the login code?"
```javascript

## Issue Detection
```bash
# Instead of: apex detect-issues
apex "what's broken?"
apex "find all problems"
apex "show me the issues"
```javascript

## 🇳🇱 Dutch Examples (Nederlandse Voorbeelden)

### CI/CD Taken
```bash
# In plaats van: apex ci:fix
apex "fix de CI"
apex "CI is kapot"
apex "repareer de build"

# In plaats van: apex ci:status
apex "wat is de CI status?"
apex "check build status"
apex "toon CI gezondheid"
```javascript

## Documentatie
```bash
# In plaats van: apex doc:generate
apex "genereer documentatie"
apex "maak docs"
apex "schrijf documentatie"

# In plaats van: apex doc:fix-links
apex "fix kapotte links"
apex "repareer documentatie links"
```javascript

## Code Kwaliteit
```bash
# In plaats van: apex quality:fix-all
apex "fix alle code problemen"
apex "ruim de code op"
apex "formatteer alles"

# In plaats van: apex quality:console-clean
apex "verwijder console logs"
apex "maak console statements schoon"
```javascript

## Git Operaties
```bash
# In plaats van: apex git:commit && apex git:push
apex "commit en push"
apex "sla op en upload wijzigingen"
apex "commit alles en push"
```javascript

## Zoeken
```bash
# In plaats van: apex search "auth"
apex "vind authenticatie code"
apex "zoek naar auth functies"
apex "waar is de login code?"
```javascript

## Probleem Detectie
```bash
# In plaats van: apex detect-issues
apex "wat is kapot?"
apex "vind alle problemen"
apex "toon me de problemen"
```javascript

## 🎯 Recipe Triggers

Natural language can trigger complex recipes:

### English
- "start my day" → `start-day` recipe
- "end of day" → `end-day` recipe
- "fix everything" → `fix-all` recipe
- "clean code" → `clean-code` recipe

### Dutch
- "start mijn dag" → `start-day` recipe
- "einde van de dag" → `end-day` recipe
- "fix alles" → `fix-all` recipe
- "schone code" → `clean-code` recipe

## 💡 Tips for Natural Language

1. **Be conversational** - Write like you're talking to a colleague
2. **Keywords matter** - Include key terms like "fix", "generate", "search"
3. **Context helps** - "fix the CI" is clearer than just "fix"
4. **Try variations** - Multiple phrases map to the same command

## 🔧 Advanced Patterns

### With Arguments
```bash
apex "search for handleLogin function"
apex "find all TypeScript files"
apex "commit with message: Fixed auth bug"
```javascript

### Multiple Actions
```bash
apex "fix all issues and run tests"
apex "generate docs and update readme"
apex "commit, push and monitor CI"
```javascript

## 📊 Pattern Matching

The system uses:
1. **Exact matches** - Direct pattern recognition
2. **Regex patterns** - Flexible matching with wildcards
3. **Fuzzy matching** - Finds closest command if no exact match
4. **Context awareness** - Understands related terms

## 🚀 Examples by Category

### Morning Routine
```bash
apex "good morning"
apex "start my work day"
apex "goedemorgen" (Dutch)
```javascript

### Fixing Problems
```bash
apex "fix"
apex "repair everything"
apex "repareer alles" (Dutch)
```javascript

### Status Checks
```bash
apex "how's everything?"
apex "show me the status"
apex "hoe gaat het?" (Dutch)
```javascript

### Cleanup
```bash
apex "clean up"
apex "make it neat"
apex "opruimen" (Dutch)
```javascript

---

*Natural language makes Apex Hive accessible to everyone, regardless of technical expertise.*