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
    $previewFrame.classList.add('shown');
};

const onClick = (context) => {
    return () => {
        if (context.template !== null) {
            const exampleFile = context.template({
                js: context.editor.getValue(),
                base: context.templateBase
            });
            createIFrame(context, exampleFile);
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
    if(url){
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


const decorateTextArea = ($element) => {
    const $parent = $element.parentElement;

    const $previewEditor = document.createElement('div');
    $previewEditor.classList.add('previewEditor');



    $parent.replaceChild($previewEditor, $element);
    $previewEditor.appendChild($element);


    const $frameParent = document.querySelector(`#${$element.dataset['kelenkenOut']}`);


    const editor = codemirror.fromTextArea($element, {
        lineNumbers: true,
        mode: "javascript"
    });
    editor.setValue(editor.getValue().trim());

    return {
        editor,
        dataset: $element.dataset,
        template: null, // TODO: Default template
        //templatePath: $element.dataset['kelenkenTemplate'],
        //template: null,
        //canRun: $element.dataset['kelenkenStatic'] === 'true',
        $parent,
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
