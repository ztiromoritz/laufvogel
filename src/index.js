// @__flow
import codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/neo.css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import './css/style.css';
import _ from 'lodash';
import "promise-peek";

const DEFAULT_TEMPLATE = _.template(require('./templates/defaultTemplate._')); //TODO: console.log example


const createIFrame = (context, html) => {
    const $previewFrame = document.createElement('iframe');
    $previewFrame.classList.add('previewFrame');
    context.$frameParent.innerHTML = "";
    context.$frameParent.appendChild($previewFrame)
    $previewFrame.contentWindow.document.write(html);
    context.$frameParent.classList.add('shownKelenkenPreview');
};

const onClick = (context) => {
    return () => {
        if (context.template !== null) {
            const html = context.template({
                js: context.editor.getValue(),
                base: context.templateBase
            });
            createIFrame(context, html)
        }
    }
};


const wireButton = (contextPromise) => {
    return contextPromise.then((context) => {
        if (context.dataset['kelenkenStatic'] !== 'true') {
            const $runButton = document.createElement('div');
            context.$previewEditor.appendChild($runButton);
            $runButton.classList.add('previewButton');
            $runButton.innerText = "RUN";
            $runButton.addEventListener('click', onClick(context));
        }
        return context;
    });
};

const _cache = {};
const loadTemplateFromUrl = (url) => {
    if (url) {
        return fetch(url)
            .then(response => response.text())
            .then((templateText) => _.template(templateText))
            .catch(() => DEFAULT_TEMPLATE)
    } else {
        return Promise.resolve(DEFAULT_TEMPLATE)
    }

};

const loadTemplate = (context) => {
    const url = context.dataset['kelenkenTemplate'] || null;
    if (url) {
        context.templateBase = (new URL(url, window.location.href)).href;
    }
    return (() => {
            if (_cache[url]) {
                return Promise.resolve(_cache[url]);
            } else {
                return loadTemplateFromUrl(url).then(template => {
                    _cache[url] = template;
                    return template
                });
            }
        }
    )().then((template) => Object.assign(context, {template}));
};


/**
 * This:
 * > textarea (*)
 *
 * is transformed to this:
 * > previewArea
 *   > previewEditor
 *     > textarea (* display: none;)
 *     > codemirror
 *     > button
 *   > [frameParent]
 *
 *
 *
 * @param $textarea
 * @returns {{editor: *, dataset: *|DOMStringMap, template: null, $parent: HTMLElement, $previewEditor: HTMLDivElement, $frameParent: Element}}
 */
const decorateTextArea = ($textarea) => {
    const $parent = $textarea.parentElement;

    const $previewArea = document.createElement('div');
    $previewArea.classList.add('previewArea');
    $parent.replaceChild($previewArea, $textarea);

    const $previewEditor = document.createElement('div');
    $previewEditor.classList.add('previewEditor');
    $previewArea.appendChild($previewEditor);

    let $frameParent = document.querySelector(`#${$textarea.dataset['kelenkenOut']}`);
    if (!$frameParent) {
        $frameParent = document.createElement('div');
        $frameParent.classList.add('frameParent');
        $previewArea.appendChild($frameParent);
    }

    $previewEditor.appendChild($textarea);
    const editor = codemirror.fromTextArea($textarea, {
        lineNumbers: true,
        mode: "javascript"
    });
    editor.setValue(editor.getValue().trim());

    return {
        editor,
        dataset: $textarea.dataset,
        template: null, // TODO: Default template
        //templatePath: $element.dataset['kelenkenTemplate'],
        //template: null,
        //canRun: $element.dataset['kelenkenStatic'] === 'true',
        $parent,
        $previewArea,
        $previewEditor,
        $frameParent
    };
};


const scan = () => {
    console.log("scan", document);
    if (typeof document !== 'undefined') {
        const $elements = Array.prototype.slice.call(document.querySelectorAll("[data-kelenken-tabs]"));
        $elements
            .map(decorateTextArea)
            .map(loadTemplate)
            .map(wireButton);
    }
    //console.log('hello world');
};

export {scan};
