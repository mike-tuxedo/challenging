class Store {
    constructor(data) {
        this._data = data;
        this._watchers = {};
        this._elements = new Map();
        this._listeners = [];
        this.state = new Proxy(this._data, {
            set: (target, key, value) => {
                target[key] = value;
                this._notify(key);
                console.log('Store changed:', key, '=', value);
                return true;
            }
        });
        this._init();
    }

    reparse(element = document.body) {
        // Text interpolation
        this._scanTextNodes(element);

        // @bind
        element.querySelectorAll('[\\@bind]').forEach(el => {
            if (el.hasAttribute('data-bound')) return;
            const key = el.getAttribute('@bind');
            el.value = this._get(key);
            el.addEventListener('input', (e) => this.state[key] = e.target.value);
            this._track(key, el);
            el.setAttribute('data-bound', 'true');
        });

        // @class
        element.querySelectorAll('[\\@class]').forEach(el => {
            if (el.hasAttribute('data-class-bound')) return;
            const expr = el.getAttribute('@class');
            const baseClass = el.className;
            if (baseClass) el.setAttribute('data-base-class', baseClass);
            this._updateClass(el, expr);
            const vars = expr.match(/\w+/g);
            vars?.forEach(v => this._track(v, el));
            el.setAttribute('data-class-bound', 'true');
        });

        // @attr
        element.querySelectorAll('[\\@attr]').forEach(el => {
            if (el.hasAttribute('data-attr-bound')) return;
            const expr = el.getAttribute('@attr');
            this._updateAttr(el, expr);
            const vars = expr.match(/\w+/g);
            vars?.forEach(v => this._track(v, el));
            el.setAttribute('data-attr-bound', 'true');
        });
    }

    _init() {
        this.reparse();
    }

    _scanTextNodes(node) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        
        nodes.forEach(textNode => {
            const text = textNode.textContent;
            if (text.includes('{')) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(/\{(\w+)\}/g, (match, key) => {
                    this._track(key, span);
                    return `<span data-var="${key}">${this._get(key)}</span>`;
                });
                textNode.replaceWith(...span.childNodes);
            }
        });
    }
    
    on(event, callback) {
        this._listeners.push({ event, callback });
    }
    
    _emit(event, data) {
        console.log(`[Store] ${event}:`, data);
        this._listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }
    
    _get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this._data);
    }
    
    _set(path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const obj = keys.reduce((o, k) => o[k], this._data);
        obj[last] = value;
    }
    
    _track(key, el) {
        if (!this._elements.has(key)) this._elements.set(key, []);
        this._elements.get(key).push(el);
    }
    
    _update(key) {
        // Update text
        document.querySelectorAll(`[data-var="${key}"]`).forEach(el => {
            el.textContent = this._get(key);
        });
        
        // Update tracked elements
        this._elements.get(key)?.forEach(el => {
            if (el.hasAttribute('@bind')) {
                el.value = this._get(key);
            }
            if (el.hasAttribute('@class')) {
                this._updateClass(el, el.getAttribute('@class'));
            }
            if (el.hasAttribute('@attr')) {
                this._updateAttr(el, el.getAttribute('@attr'));
            }
        });
    }
    
    _updateClass(el, expr) {
        const baseClasses = el.getAttribute('data-base-class') || '';
        const result = new Function(...Object.keys(this._data), `return ${expr}`)
            (...Object.values(this._data));
        el.className = baseClasses + (baseClasses && result ? ' ' : '') + result;
    }
    
    _updateAttr(el, expr) {
        const [attr, value] = expr.split('=');
        const result = new Function(...Object.keys(this._data), `return ${value}`)
            (...Object.values(this._data));
        el.setAttribute(attr.trim(), result);
    }

    _notify(key) {
        this._update(key);
    }
}
