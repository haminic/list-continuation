const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(
		vscode.commands.registerCommand("list-continuation.onEnter", onEnter)
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
	const langID = editor.document.languageId;
	const langRules = rules[langID];
	
	if (!Array.isArray(langRules) || langRules.length === 0 || config.get("disabled-languages").includes(langID)) {
		return vscode.commands.executeCommand("type", { source: "keyboard", text: "\n" });
	}

	let matchedNothing = true;
	const actions = [];
	
	for (const selection of editor.selections) {
		const cursorPos = selection.active;
		const line = editor.document.lineAt(cursorPos.line);
		const indentation = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);

		let matched = false;
		for (const rule of langRules) {
			const regexString = "^\\s*" + escapeForRegex(rule.start);

			// removes line if the prefix is there, but line is empty
			if (rule.removeIfEmpty && (new RegExp(`${regexString}\\s*$`)).test(line.text)) {
				const rangeToDelete = line.range.with(cursorPos.with(line.lineNumber, line.firstNonWhitespaceCharacterIndex), line.range.end);
				actions.push(editBuilder => editBuilder.delete(rangeToDelete));
				matched = true;
				matchedNothing = false;
				break;
			} 

			// continues the list if prefix is there, and cursor is after the prefix 
			const match = (new RegExp(`(${regexString})\\s*[^\\s]+.*`)).exec(line.text);
			if (match && cursorPos.character >= match[1].length) {
				const itemString = `\n${indentation}${rule.continue}`;
				actions.push(editBuilder => editBuilder.insert(cursorPos, itemString));
				matched = true;
				matchedNothing = false;
				break;
			} 
		}

		if (!matched) {
			actions.push(editBuilder => editBuilder.insert(cursorPos, `\n${indentation}`));
		}
	}

	// if matches nothing, use default enter behavior
	if (matchedNothing) {
		return vscode.commands.executeCommand("type", { source: "keyboard", text: "\n" });
	}

	return editor.edit(editBuilder => {
		actions.forEach(action => {
			action(editBuilder);
		});
	});

}

function escapeForRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}