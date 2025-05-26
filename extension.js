const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(
		vscode.commands.registerCommand("list-continuation.onEnter", onEnter)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("list-continuation.onTab", onTab)
	);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

function onEnter() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }

	const config = vscode.workspace.getConfiguration("list-continuation");
	const rules = config.get("rules") || {};
	const langRules = rules[editor.document.languageId];

	if (!Array.isArray(langRules) || langRules.length === 0) {
		return vscode.commands.executeCommand("type", { source: "keyboard", text: "\n" });
	}

	return editor.edit(editBuilder => {
		for (const selection of editor.selections) {
			const cursorPos = selection.active;
			const line = editor.document.lineAt(cursorPos.line);
			const indentation = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);

			let matched = false;
			for (const rule of langRules) {
				const regexString = "^\\s*" + escapeForRegex(rule.start);

				if (rule.removeIfEmpty && (new RegExp(`${regexString}\\s*$`)).test(line.text)) {
					const rangeToDelete = line.range.with(cursorPos.with(line.lineNumber, line.firstNonWhitespaceCharacterIndex), line.range.end);
					editBuilder.delete(rangeToDelete);
					matched = true;
					break;
				} else if ((new RegExp(`${regexString}\\s*[^\\s]+.*`)).test(line.text)) {
					const itemString = `\n${indentation}${rule.continue}`;
					editBuilder.insert(cursorPos, itemString);
					matched = true;
					break;
				} 
			}

			if (!matched) {
				editBuilder.insert(cursorPos, `\n${indentation}`);
			}
		}
	});

}

function onTab() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }

	const config = vscode.workspace.getConfiguration("list-continuation");
	const rules = config.get("rules") || {};
	const langRules = rules[editor.document.languageId];
	
	if (!Array.isArray(langRules) || langRules.length === 0) {
		return vscode.commands.executeCommand("tab");
	}

	return editor.edit(editBuilder => {
		for (const selection of editor.selections) {
			const cursorPos = selection.active;
			const line = editor.document.lineAt(cursorPos.line);

			let matched = false;
			for (const rule of langRules) {
				const regexString = "^\\s*" + escapeForRegex(rule.start);

				if ((new RegExp(`${regexString}\\s*$`)).test(line.text)) {
					const insertPos = cursorPos.with(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
					editBuilder.insert(insertPos, "\t");
					matched = true;
					break;
				}
			}

			if (!matched) {
				editBuilder.insert(cursorPos, "\t");
			}
		}
	});

}

function escapeForRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}