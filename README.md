# List Continuation

## ▸ About 📖

This is a simple VSCode extension that adds customizable list continuation behavior. Inspired by how `- ` continues automatically in Markdown extensions, this extension gives you the ability to define your own list styles (per language), and have them continue automatically when pressing `Enter`.

This was made quickly as a personal tool, mainly for efficiency with custom list-like $\LaTeX$ macros, so expect a few rough edges. But if you happen to use custom macros in $\LaTeX$ or want custom smart list behavior—maybe it could help.

## ▸ Features 📦

- **Custom list definitions** per language  
  Define your own list prefixes that trigger continuation.

- **Smart list continuation**  
  Pressing `Enter` at the end of a list item will automatically continue the list.

- **Auto-deletion of empty list items**  
  Akin to LaTeX Workshop, pressing `Enter` on an empty list item (i.e. just the prefix with no content), the list prefix will be deleted instead (can be disabled).

## ▸ Configuration ⚙️

List continuation rules are set in your `settings.json` under `list-continuation.rules`. As an example:

```json
"list-continuation.rules": {
    "latex": {
        "start": "\\myitem",
        "continue": "\\myitem ",
        "removeIfEmpty": true
    }
}
```

Other options include:
- `list-continuation.disabled-languages`: List of language IDs that this extension will not take effect.

## ▸ Credits 💳

The behavior for handling the `Enter` key is based on LaTeX Workshop’s auto-`\item` logic, with a few tweaks.