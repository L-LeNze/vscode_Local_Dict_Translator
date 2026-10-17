import * as vscode from 'vscode';
import { dictData } from './dicts';

let timeout: NodeJS.Timeout | undefined;

// 提取字典里所有的英文单词，转为小写，放进一个 Set 里。
// 这样查词速度极快，且用于智能切分算法。
const englishWordSet = new Set(Object.values(dictData).map(v => v.en.toLowerCase()));

// 1. 基础拆分（按大写字母和下划线）
function splitCamelCase(text: string): string[] {
	let temp = text.replace(/_/g, ' ');
	temp = temp.replace(/([a-z])([A-Z])/g, '$1 $2');
	return temp.split(' ').filter(w => w.length > 0).map(w => w.toLowerCase());
}

// 2. 智能字典切分（用于全小写连写，如 calculatediff）
function smartSplitByDict(text: string, wordSet: Set<string>): string[] {
	let result: string[] = [];
	let i = 0;
	while (i < text.length) {
		let matched = false;
		// 尝试从长到短匹配字典里的单词（最长支持20个字符）
		for (let len = Math.min(text.length - i, 20); len >= 3; len--) {
			const sub = text.substring(i, i + len);
			if (wordSet.has(sub)) {
				result.push(sub);
				i += len;
				matched = true;
				break;
			}
		}
		if (!matched) {
			// 如果连字典里都没有这部分，就把剩下的原样返回，停止切分
			result.push(text.substring(i));
			break;
		}
	}
	return result;
}

// 3. 辅助函数：对拆分出来的词数组，去字典里找中文翻译
function getTranslationsForWords(words: string[]) {
	const splitResults: string[] = [];
	const missingWords: string[] = [];
	for (const word of words) {
		let foundChinese = "";
		for (const [chineseKey, wordInfo] of Object.entries(dictData)) {
			if (wordInfo.en.toLowerCase() === word) {
				foundChinese = chineseKey;
				break;
			}
		}
		if (foundChinese) {
			splitResults.push(`[${word}:${foundChinese}]`);
		} else {
			missingWords.push(word);
		}
	}
	return { splitResults, missingWords };
}

function performTranslation(editor: vscode.TextEditor, text: string, selectionEnd: vscode.Position, decorationType: vscode.TextEditorDecorationType) {
	let resultText = "未找到该词条";
	const isChinese = /[\u4e00-\u9fa5]/.test(text);

	if (isChinese) {
		// ==================== 中译英 ====================
		if (dictData[text]) {
			const wordInfo = dictData[text];
			resultText = `${wordInfo.en} ${wordInfo.ipa}`;
		} else {
			const fuzzyMatches: string[] = [];
			for (const key of Object.keys(dictData)) {
				if (key.includes(text)) {
					fuzzyMatches.push(`${key}:${dictData[key].en}`);
					if (fuzzyMatches.length >= 3) break;
				}
			}
			if (fuzzyMatches.length > 0) resultText = fuzzyMatches.join(' | ');
		}
	} else {
		// ==================== 英译中 ====================
		const lowerText = text.toLowerCase();
		let exactMatchFound = false;

		// 优先级 1：完整匹配
		for (const [chineseKey, wordInfo] of Object.entries(dictData)) {
			if (wordInfo.en.toLowerCase() === lowerText) {
				resultText = `${chineseKey} ${wordInfo.ipa}`;
				exactMatchFound = true;
				break;
			}
		}

		// 优先级 2 & 3：智能拆分
		if (!exactMatchFound) {
			let splitResult = { splitResults: [] as string[], missingWords: [] as string[] };
			
			const camelWords = splitCamelCase(text);
			if (camelWords.length > 1) {
				// 说明有大小写或下划线，直接拆
				splitResult = getTranslationsForWords(camelWords);
			} else {
				// 全小写连写，尝试智能字典切分
				const smartWords = smartSplitByDict(lowerText, englishWordSet);
				if (smartWords.length > 1 || (smartWords.length === 1 && englishWordSet.has(smartWords[0]))) {
					splitResult = getTranslationsForWords(smartWords);
				}
			}

			// 如果拆分后有结果（比如找到了 calculate）
			if (splitResult.splitResults.length > 0) {
				resultText = splitResult.splitResults.join(' ');
				if (splitResult.missingWords.length > 0) {
					resultText += ` (缺:${splitResult.missingWords.join(',')})`;
				}
			} else {
				// 优先级 4：兜底模糊搜索（满足你单独查 diff 时，搜出 difference 的需求）
				const fuzzyMatches: string[] = [];
				for (const [chineseKey, wordInfo] of Object.entries(dictData)) {
					if (wordInfo.en.toLowerCase().includes(lowerText)) {
						fuzzyMatches.push(`${wordInfo.en}:${chineseKey}`);
						if (fuzzyMatches.length >= 3) break;
					}
				}
				if (fuzzyMatches.length > 0) resultText = fuzzyMatches.join(' | ');
			}
		}
	}

	// 渲染提示
	const decoration: vscode.DecorationOptions = {
		range: new vscode.Range(selectionEnd, selectionEnd),
		renderOptions: {
			after: { contentText: ` => ${resultText}` }
		}
	};
	editor.setDecorations(decorationType, [decoration]);
}

export function activate(context: vscode.ExtensionContext) {
	const decorationType = vscode.window.createTextEditorDecorationType({
		after: { color: '#888888', fontStyle: 'italic', margin: '0 0 0 10px' }
	});

	let disposable = vscode.commands.registerCommand('local-dict-translator.translate', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		editor.setDecorations(decorationType, []);
		const selection = editor.selection;
		const text = editor.document.getText(selection).trim();
		if (!text) return;
		performTranslation(editor, text, selection.end, decorationType);
	});

	let selectionListener = vscode.window.onDidChangeTextEditorSelection((event) => {
		const editor = event.textEditor;
		const selection = event.selections[0];
		editor.setDecorations(decorationType, []);

		if (timeout) clearTimeout(timeout);

		timeout = setTimeout(() => {
			if (selection.isEmpty || selection.start.line !== selection.end.line) return;
			const text = editor.document.getText(selection).trim();
			const isWord = /^[\u4e00-\u9fa5]+$/.test(text) || /^[a-zA-Z0-9_]+$/.test(text);

			if (isWord && text.length > 0 && text.length < 30) {
				performTranslation(editor, text, selection.end, decorationType);
			}
		}, 300);
	});

	let textChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;
		if (editor && event.document === editor.document) {
			editor.setDecorations(decorationType, []);
		}
	});

	context.subscriptions.push(disposable, selectionListener, textChangeListener);
}

export function deactivate() {
	if (timeout) clearTimeout(timeout);
}