// @__flow
import codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/neo.css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/keymap/vim';
import './css/style.css';
import _ from 'lodash';

const DEFAULT_TEMPLATE = _.template(require('./templates/defaultTemplate._')); //TODO: console.log example

const createIFrame = (context, html) => {
    const $previewFrame = document.createElement('iframe');
    $previewFrame.classList.add('previewFrame');
    context.$frameParent.innerHTML = "";
    context.$frameParent.appendChild($previewFrame)
    $previewFrame.contentWindow.document.write(html);
    context.$frameParent.classList.add('shownLaufvogelPreview');
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
        if (context.config.static !== 'true') {
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
    const url = context.config.template;
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
const decorateTextArea = (context) => {
    const $textarea = context.$textarea;
    const $parent = $textarea.parentElement;

    const $previewArea = document.createElement('div');
    $previewArea.classList.add('_laufvogel');
    $previewArea.classList.add('previewArea');
    $parent.replaceChild($previewArea, $textarea);

    const $previewEditor = document.createElement('div');
    $previewEditor.classList.add('previewEditor');
    $previewArea.appendChild($previewEditor);

    let $frameParent = document.querySelector(`#${context.config.out}`);
    if (!$frameParent) {
        $frameParent = document.createElement('div');
        $frameParent.classList.add('frameParent');
        $previewArea.appendChild($frameParent);
    }

    $previewEditor.appendChild($textarea);
    // TODO: tabs or type dependent settings
    const editor = codemirror.fromTextArea($textarea, context.config.codemirror);
    editor.setValue(editor.getValue().trim());


    return Object.assign(context,{
        editor,
        $parent,
        $previewArea,
        $previewEditor,
        $frameParent
    });
};


const localValueAdder = (localConfig, $textarea) => {
    const adder = {};
    adder.add = (name) => {
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        const value = $textarea.dataset[`laufvogel${capitalize(name)}`];
        if (value) {
            localConfig[name] = value;
        }
        return adder;
    }
    return adder;
}

const createConfig = (globalConfig) => {
    const defaultConfig = {
        template: DEFAULT_TEMPLATE,
        tabs: 'js',
        static: 'false',
        codemirror: {}
    }

    return ($textarea) => {

        const localConfig = {}
        localValueAdder(localConfig, $textarea)
            .add('template')
            .add('tabs')
            .add('out')
            .add('static');

        const config = Object.assign({}, globalConfig, localConfig);

        return {
            config,
            $textarea
        }

    };

}


const scan = (globalConfig) => {
    console.log("scan", document);
    if (typeof document !== 'undefined') {
        const $elements = Array.prototype.slice.call(document.querySelectorAll("[data-laufvogel]"));
        $elements
            .map(createConfig(globalConfig))
            .map(decorateTextArea)
            .map(loadTemplate)
            .map(wireButton);
    }
    //console.log('hello world');
};

export {scan};
