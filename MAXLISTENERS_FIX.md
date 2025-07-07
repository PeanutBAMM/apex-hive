# MaxListenersExceededWarning Fix

## Het Probleem

Externe MCP servers (zoals Supabase) voegen soms teveel abort listeners toe aan AbortSignal objecten, wat deze waarschuwing veroorzaakt:

```
MaxListenersExceededWarning: Possible EventTarget memory leak detected.
11 abort listeners added to [AbortSignal]. MaxListeners is 10.
```

## De Elegante Oplossing

In plaats van proberen listener limieten te verhogen (wat technisch niet werkt omdat AbortSignal geen EventEmitter is), onderdrukken we specifiek deze warning met een globale filter.

### Automatische Setup

```bash
./setup-warning-filter.sh
```

Dit script:
1. Configureert NODE_OPTIONS in je shell profile
2. Laadt `warning-filter.js` globally
3. Filtert alleen MaxListenersExceededWarning voor AbortSignal

### Handmatige Setup

Als je de setup handmatig wilt doen:

```bash
export NODE_OPTIONS="--require /path/to/apex-hive/warning-filter.js"
```

Voeg deze regel toe aan je `~/.bashrc` of `~/.zshrc`.

## Waarom Dit Werkt

- **Specifiek**: Onderdrukt alleen de AbortSignal warning, andere warnings blijven
- **Globaal**: Werkt voor alle Node.js processen (inclusief npx commands)
- **Elegant**: Geen wrappers, geen modificaties aan externe servers
- **Schaalbaar**: Eén configuratie lost het probleem overal op

## Testen

Na setup zou je geen MaxListenersExceededWarning meer moeten zien van AbortSignal, maar andere warnings blijven gewoon werken.