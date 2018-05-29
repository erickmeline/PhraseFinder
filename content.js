window.onload = function() {

const url = chrome.extension.getURL('./phrases.json')

fetch(url).then((response) => response.json()).then((json) => parseText(json));

const parsePage = (node, regex, callback) => { 
	const excludeElements = ['script', 'style', 'canvas'];
	let child = node.firstChild;
	while (child) {
		switch (child.nodeType) {
		case 1:
			if (excludeElements.indexOf(child.tagName.toLowerCase()) > -1)
				break;
			else parsePage(child, regex, callback);
				break;
		case 3:
			let block = 0;
			child.data.replace(regex, function(all) {
				let args = [].slice.call(arguments), offset = args[args.length - 2], newTextNode = child.splitText(offset+block), tag;
				block -= child.data.length + all.length;
				newTextNode.data = newTextNode.data.substr(all.length);
				tag = callback.apply(window, [child].concat(args));
				child.parentNode.insertBefore(tag, newTextNode);
				child = newTextNode;
			});
			regex.lastIndex = 0;
			break;
		}
		child = child.nextSibling;
	}
	return node;
};

const parseText = (phrases) => {
	const entryPoint = document.getElementsByTagName('body')[0];
	Object.keys(phrases).forEach(key => {
		let phraseClassName = key;
		let phraseGroup = phrases[key];
		phraseGroup.forEach((phrase) => {
			let phraseRegex = new RegExp('\\b' + phrase.phrase + '(?:es|s)?\\b','gi');
			parsePage(entryPoint, phraseRegex, function(node, match, offset) {
				let mark = document.createElement('mark');
				mark.className = phraseClassName;
				mark.textContent = match;
				mark.dataset.suggestion = phrase.suggestion;
				return mark;
			});
		});
	});
};

} // window.onload
