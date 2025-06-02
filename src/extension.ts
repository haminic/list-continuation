import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand("list-continuation.onEnter", onEnter)
	);
}

export function deactivate() {}

interface Rule {
	start: string;
	continue: string;
	removeIfEmpty: boolean;
}

function onEnter(): Thenable<boolean> | undefined {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }

	const config = vscode.workspace.getConfiguration("list-continuation");
	const rules = config.get<Record<string, Rule[]>>("rules") ?? {};
	const disabledLangs = config.get<string[]>("disabled-languages") ?? [];

	const langID = editor.document.languageId;
	const langRules = rules[langID];

	if (!Array.isArray(langRules) || langRules.length === 0 || disabledLangs.includes(langID)) {
		return vscode.commands.executeCommand("type", { source: "keyboard", text: "\n" });
	}

	let matchedNothing = true;
	const actions: ((editBuilder: vscode.TextEditorEdit) => void)[] = [];

	for (const selection of editor.selections) {
		const cursorPos = selection.active;
		const line = editor.document.lineAt(cursorPos.line);
		const indentation = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);

		let matched = false;

		for (const rule of langRules) {
			const regex = new RegExp(`^\\s*${escapeForRegex(rule.start)}`);
			const match = regex.exec(line.text);

			if (!match || cursorPos.character < match[0].length) { continue; }

			const stringAfterPrefix = line.text.slice(match[0].length);

			if (rule.removeIfEmpty && /^\s*$/.test(stringAfterPrefix)) {
				const rangeToDelete = line.range.with(
					cursorPos.with(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
					line.range.end
				);
				actions.push(editBuilder => editBuilder.delete(rangeToDelete));
			} else {
				actions.push(editBuilder => editBuilder.insert(cursorPos, `\n${indentation}${rule.continue}`));
			}

			matched = true;
			matchedNothing = false;
			break;
		}

		if (!matched) {
			actions.push(editBuilder => editBuilder.insert(cursorPos, `\n${indentation}`));
		}
	}

	if (matchedNothing) {
		return vscode.commands.executeCommand("type", { source: "keyboard", text: "\n" });
	}

	return editor.edit(editBuilder => {
		actions.forEach(action => action(editBuilder));
	});
}

function escapeForRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
