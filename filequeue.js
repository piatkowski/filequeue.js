function FileQueue($config) {

    "use strict";

    const DEBUG = true;

    let _this = this;

    this.queue = [];
    this.keys = [];

    if (!('FileReader' in window)) {
        throw Error("FileQueue [error]: FileReader is required!");
    }

    let indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

    if (!indexedDB) {
        throw Error("FileQueue [error]: This browser doesn't support IndexedDB.");
    }

    function open() {
        return new Promise(resolve => {
            let request = indexedDB.open($config.db);
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onupgradeneeded = function () {
                request.result.createObjectStore($config.store);
            };
        });
    }

    function transaction(options) {
        return new Promise(resolve => {
            open().then(db => {
                let transaction = db.transaction($config.store, 'readwrite').objectStore($config.store);
                let request;
                switch (options.action) {
                    case 'put':
                        request = transaction.put(options.file, options.key);
                        break;
                    case 'get':
                        request = transaction.get(options.key);
                        break;
                    case 'getAllKeys':
                        request = transaction.getAllKeys();
                        break;
                    case 'delete':
                        request = transaction.delete(options.key);
                        break;
                }
                request.onsuccess = resolve;
            });
        });
    }

    this.add = (key, file) => {
        _this.queue.push(file);
        _this.queue[_this.queue.length - 1].key = key;
        _this.keys.push(key);
    };

    this.push = () => {
        let requests = [];
        for (let i = 0; i < _this.queue.length; i++) {
            requests.push();
            requests[i] = new Promise(resolve => {
                var reader = new window.FileReader();
                reader.onload = () => transaction({
                    action: 'put',
                    file: reader.result,
                    key: _this.queue[i].key
                }).then(resolve);
                reader.readAsBinaryString(_this.queue[i]);
            });
        }
        return Promise.all(requests);
    };

    this.get = key => {
        return new Promise(resolve => transaction({action: 'get', key: key}).then(resolve));
    };

    this.getInfo = key => {
        return _this.queue[_this.keys.indexOf(key)];
    };

    this.getKeys = () => {
        return new Promise(resolve => transaction({action: 'getAllKeys'}).then(resolve));
    };

    this.delete = key => {
        return new Promise(resolve => transaction({action: 'delete', key: key}).then(resolve));
    };

    this.clear = () => {
        let requests = [];
        for(let i = 0; i < _this.queue.length; i++) {
            requests.push();
            requests[i] = new Promise(resolve => this.delete(_this.queue[i].key).then(resolve));
        }
        return Promise.all(requests).then(() => {
            _this.queue = [];
            _this.keys = [];
        });
    };
}
