# Apex Hive - Development Project

## 📁 Dit Project

Dit is het **Apex Hive development project** zelf - de broncode van het AI Development Hub systeem.

**Doel**: Ontwikkelen en onderhouden van de Apex Hive ecosystem die gebruikers één centrale hub biedt voor AI-gestuurde development automation.

## 🏗️ Wat Dit Project Bevat

- **MCP Servers**: 
  - `mcp-server.js` - Gateway server voor apex commands
  - `mcp-filesystem-cached.js` - Cached file operations server
- **Core System**:
  - `apex-router.js` - Command routing met natural language support
  - `scripts/` - 63 individuele command scripts
  - `recipes/` - 8 workflow combinaties
  - `modules/` - Shared modules (cache, formatters, file-ops)

## 🚀 Installatie voor Gebruikers

```bash
npm install apex-hive
apex init
```

---

*Voor complete documentatie en usage: zie global CLAUDE.md*