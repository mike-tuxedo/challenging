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
                return true;
            }
        });
        this._init();
    }

    reparse(element = document.body) {
        // @for ZUERST!
        element.querySelectorAll('[\\@for]').forEach(template => {
            if (template.hasAttribute('data-for-bound')) return;

            const expr = template.getAttribute('@for');
            const [itemName, arrayName] = expr.split(' in ').map(s => s.trim());

            const itemTemplate = template.children[0]?.cloneNode(true);
            if (!itemTemplate) return;

            template.innerHTML = '';
            template.setAttribute('data-for-bound', 'true');
            template.setAttribute('data-for-item', itemName);
            template.setAttribute('data-for-array', arrayName);
            template.setAttribute('data-for-template', itemTemplate.outerHTML);

            this._renderFor(template, itemTemplate, itemName, arrayName);
            this._track(arrayName, template);
        });

        // Text interpolation
        this._scanTextNodes(element);

        // @bind
        element.querySelectorAll('[\\@bind]').forEach(el => {
            if (el.hasAttribute('data-bound')) return;
            const key = el.getAttribute('@bind');
            
            // Checke ob checked attribute
            if (el.type === 'checkbox') {
                el.checked = !!this._get(key);
                el.addEventListener('change', (e) => {
                    this._set(key, e.target.checked);
                    this._notify(key.split('.')[0]); // Notify parent array
                });
            } else {
                el.value = this._get(key) || '';
                el.addEventListener('input', (e) => {
                    this._set(key, e.target.value);
                    this._notify(key.split('.')[0]);
                });
            }
            
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

    _renderFor(container, template, itemName, arrayName) {
        const array = this._get(arrayName) || [];
        container.innerHTML = '';
        
        array.forEach((item, index) => {
            const clone = template.cloneNode(true);
            
            // 1. Text {todo.title} ersetzen - RECURSIVE durch alle Kinder
            this._replaceTextInNode(clone, itemName, arrayName, index, item);
            
            // 2. @bind auflösen (NICHT als Attribut lassen!)
            clone.querySelectorAll('[\\@bind]').forEach(el => {
                const bindExpr = el.getAttribute('@bind');
                el.removeAttribute('@bind'); // WICHTIG!
                
                const key = `${arrayName}.${index}.${bindExpr.replace(itemName + '.', '')}`;
                const templateKey = `${arrayName}.__INDEX__.${bindExpr.replace(itemName + '.', '')}`;

                el.setAttribute('data-bind-key', templateKey);

                if (el.type === 'checkbox') {
                    el.checked = !!this._get(key);
                    el.addEventListener('change', (e) => {
                        this._set(key, e.target.checked);
                        this._notify(arrayName);
                    });
                } else {
                    el.value = this._get(key) || '';
                    el.addEventListener('input', (e) => {
                        this._set(key, e.target.value);
                        this._notify(arrayName);
                    });
                }
            });

            // 3. @click
            const elementsWithClick = [];
            if (clone.matches('[\\@click]')) {
                elementsWithClick.push(clone);
            }
            elementsWithClick.push(...clone.querySelectorAll('[\\@click]'));

            elementsWithClick.forEach(el => {
                const clickExpr = el.getAttribute('@click');
                el.removeAttribute('@click');
                const match = clickExpr.match(/(\w+)\((.*)\)/);
                if (match) {
                    const methodName = match[1];
                    const argName = match[2].trim();
                    if (typeof window[methodName] === 'function' && argName === itemName) {
                        el.addEventListener('click', () => window[methodName](item));
                    }
                }
            });
            
            // 3. @attr auflösen
            clone.querySelectorAll('[\\@attr]').forEach(el => {
                const expr = el.getAttribute('@attr');
                el.removeAttribute('@attr');
                const [attr, valueExpr] = expr.split('=');
                const value = valueExpr.replace(itemName + '.', '');
                el.setAttribute(attr.trim(), item[value] || '');
            });
            
            container.appendChild(clone);
        });
    }
    
    _replaceTextInNode(node, itemName, arrayName, index, item) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Text node - ersetze {todo.title}
            node.textContent = node.textContent.replace(
                new RegExp(`\\{${itemName}\\.(\\w+)\\}`, 'g'),
                (_, prop) => item[prop] || ''
            ).replace(/\{index\}/g, index);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Element node - durchsuche Kinder
            Array.from(node.childNodes).forEach(child => {
                this._replaceTextInNode(child, itemName, arrayName, index, item);
            });
        }
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
                    return `<span data-var="${key}">${this._get(key) || ''}</span>`;
                });
                textNode.replaceWith(...span.childNodes);
            }
        });
    }

    _get(path) {
        return path.split('.').reduce((obj, key) => {
            if (key.includes('[')) {
                const [arr, idx] = key.split('[');
                return obj?.[arr]?.[parseInt(idx)];
            }
            return obj?.[key];
        }, this._data);
    }

    _set(path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const obj = keys.reduce((o, k) => o[k], this._data);
        obj[last] = value;
    }

    _track(key, el) {
        const rootKey = key.split('.')[0];
        if (!this._elements.has(rootKey)) this._elements.set(rootKey, []);
        this._elements.get(rootKey).push(el);
    }

    _update(key) {
        // Update text nodes
        document.querySelectorAll(`[data-var="${key}"]`).forEach(el => {
            el.textContent = this._get(key) || '';
        });
    
        // Update tracked elements
        this._elements.get(key)?.forEach(el => {
            if (el.hasAttribute('@bind')) {
                const bindKey = el.getAttribute('@bind');
                if (el.type === 'checkbox') {
                    el.checked = !!this._get(bindKey);
                } else {
                    el.value = this._get(bindKey) || '';
                }
            }
            if (el.hasAttribute('@class')) {
                this._updateClass(el, el.getAttribute('@class'));
            }
            if (el.hasAttribute('@attr')) {
                this._updateAttr(el, el.getAttribute('@attr'));
            }
            // In der _update Methode
            if (el.hasAttribute('@for')) {
                const arrayName = el.getAttribute('data-for-array');
                const array = this._get(arrayName) || [];

                // Nur neu rendern, wenn sich die Länge des Arrays ändert (Elemente hinzu/entfernt)
                if (el.children.length !== array.length) {
                    const itemName = el.getAttribute('data-for-item');
                    const templateHTML = el.getAttribute('data-for-template');
                    if (templateHTML) {
                        const temp = document.createElement('div');
                        temp.innerHTML = templateHTML;
                        this._renderFor(el, temp.firstChild, itemName, arrayName);
                    }
                } else {
                    // Wenn Länge gleich ist: Nur die Werte der bestehenden Inputs aktualisieren
                    // (Nötig, wenn der Wert von außerhalb geändert wird)
                    Array.from(el.children).forEach((child, index) => {
                        child.querySelectorAll('[data-bind-key]').forEach(inputEl => {
                            const key = inputEl.getAttribute('data-bind-key').replace('__INDEX__', index);
                            if (inputEl.type === 'checkbox') {
                                if (inputEl.checked !== !!this._get(key)) inputEl.checked = !!this._get(key);
                            } else {
                                if (inputEl.value !== this._get(key)) inputEl.value = this._get(key) || '';
                            }
                        });
                    });
                }
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
        this._emit('change', { key, value: this._get(key), state: this._data });
    }

    _emit(event, data) {
        this._listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }

    on(event, callback) {
        this._listeners.push({ event, callback });
    }
}
