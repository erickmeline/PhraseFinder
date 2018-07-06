window.onload = function() {

const url = chrome.extension.getURL('./phrases.json');
let loadedPhrases;
const tooltip = document.createElement('ins');
tooltip.id = 'phrasesTooltip';

document.getElementsByTagName('body')[0].appendChild(tooltip);

fetch(url).then((response) => response.json()).then((json) => parseText(json));

const parsePage = (node, regex, callback) => { 
	const excludeElements = ['script', 'style', 'canvas', 'mark', 'ins'];
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
	loadedPhrases = phrases;
	if (phrases) {
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
		Tooltip.bindEvents();
	}
};

MutationObserver = window.MutationObserver;
let observer = new MutationObserver(function(mutations, observer) {
	parseText(loadedPhrases);
});

observer.observe(document, {
	subtree: true,
	attributes: true
});

const Tooltip = {
	tooltip: undefined,
	target: undefined,
	bindEvents: function() {
		Tooltip.tooltip = document.getElementById('phrasesTooltip');
		const targets = document.querySelectorAll('[data-suggestion]');
		for (let i = 0; i < targets.length; ++i) {
			targets[i].addEventListener('mouseenter', Tooltip.show);
			targets[i].addEventListener('mouseleave', Tooltip.hide);
		}
	},
	show: function() {
		Tooltip.target = this;
		const tip = this.dataset.suggestion;
		if( !tip || tip == '' ) {            
			return;
		}
		Tooltip.tooltip.innerHTML = tip ;
		if( window.innerWidth < (Tooltip.tooltip.offsetWidth * 1.5) ) {
			Tooltip.tooltip.style.maxWidth = (window.innerWidth / 2) + 'px';
		}
		else {
			Tooltip.tooltip.style.maxWidth = 320 + 'px';
		}
		let pos_top = (getOffset(Tooltip.target).top - Tooltip.tooltip.offsetHeight) - 20;
		let pos_left = (getOffset(Tooltip.target).left + (Tooltip.target.offsetWidth / 2)) - (Tooltip.tooltip.offsetWidth / 2);
		Tooltip.tooltip.className = 'show';
		if( pos_top < 0 ) {
			pos_top  = (getOffset(Tooltip.target).top + Tooltip.tooltip.offsetHeight) + 20;
			Tooltip.tooltip.className += ' top';
		}
		if( pos_left < 0 ) {
			pos_left = (getOffset(Tooltip.target).left + (Tooltip.target.offsetWidth / 2)) - 20;
			Tooltip.tooltip.className += ' left';
		}
		if( pos_left + Tooltip.tooltip.offsetWidth + 30 > window.innerWidth ) {
			pos_left = (getOffset(Tooltip.target).left - Tooltip.tooltip.offsetWidth) + (Tooltip.target.offsetWidth / 2) + 20;
			Tooltip.tooltip.className += ' right';
		}
		Tooltip.tooltip.style.left = pos_left + 'px';
		Tooltip.tooltip.style.top = pos_top + 'px';
		function getOffset(element) {
			const rect = element.getBoundingClientRect(),
			scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
			scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
			return {
				top: rect.top + scrollTop, left: rect.left + scrollLeft
			}
		}
	},
	hide: function() {
		Tooltip.tooltip.className = Tooltip.tooltip.className.replace('show', '');
	}
};

} // window.onload
