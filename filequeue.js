
function FileQueue($config) {

    "use strict";

    const DEBUG = true;

    let _this = this;
    this.queue = [];
    this.keys = [];

    if ( !('FileReader' in window) ) {
        throw Error("FileQueue [error]: FileReader is required!");
    }

    let indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;

    if (!indexedDB) {
        throw Error("FileQueue [error]: This browser doesn't support IndexedDB.");
    }

    function open() {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open($config.db);
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onupgradeneeded = function () {
                request.result.createObjectStore($config.store);
            };
        });
    }

    this.set = (files) => {
        for(let i = 0; i < files.length; i++) {
            let key = Math.random().toString(36).substr(2, 18);
            _this.queue.push(files[i]);
            _this.queue[i].key = key;
            _this.keys.push(key);
        }
        DEBUG && console.log("set: ", _this.queue, _this.keys);
        return _this.keys;
    };

    this.store = (callback) => {
        for(let i = 0; i < _this.queue.length; i++) {
            let reader = new window.FileReader();
            reader.onload = ((...key) => {
                key = key[0];
                open().then((db) => {
                    let transaction = db.transaction($config.store, 'readwrite');
                    transaction.objectStore($config.store).put(reader.result, key);
                    typeof callback === 'function' && callback(key);
                    console.log("store: File with key=" + key + " has been saved to IDB.");
                });
            })(_this.queue[i].key);
            reader.readAsBinaryString(this.queue[i]);
        }
    };

    this.get = (key, callback) => {
        open().then((db) => {
            let transaction = db.transaction($config.store, 'readonly');
            let request = transaction.objectStore($config.store).get(key);
            request.onsuccess = () => {
                callback(request.result);
                DEBUG && console.log("get: File with key=" + key + " has been recieved from IDB.");
            };
        });
    };

    this.info = (key) => {
        return _this.queue[ _this.keys.indexOf(key) ];
    };

    this.getKeys = (callback) => {
        open().then((db) => {
            let transaction = db.transaction($config.store, 'readonly');
            let request = transaction.objectStore($config.store).getAllKeys();
            request.onsuccess = () => {
                callback(request.result);
                DEBUG && console.log("getKeys: ", request.result);
            };
        });
    };

    this.delete = (key, callback) => {
        open().then((db) => {
            var transaction = db.transaction($config.store, 'readwrite');
            var request = transaction.objectStore($config.store).delete(key);
            request.onsuccess = () => {
                typeof callback === 'function' && callback(request.result);
                DEBUG && console.log("delete: ", key + " has been deleted.");
            };
        });
    };

    this.clear = () => {
        _this.getKeys((keys) => {
            for(let i = 0; i < keys.length; i++) {
                _this.delete(keys[i]);
            }
        });
    };
}
