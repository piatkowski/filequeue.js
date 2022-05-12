function FileQueue($config) {

    "use strict";

    const DEBUG = true;

    let _this = this;
    let readerContainer = [];

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

    this.add = (key, file) => {
        _this.queue.push(file);
        _this.queue[_this.queue.length - 1].key = key;
        _this.keys.push(key);
    }

    this.push = (callback) => {
        for (let i = 0; i < _this.queue.length; i++) {
            (function (file, isLast) {
                var reader = new window.FileReader();
                reader.onload = ((...key) => {
                    open().then((db) => {
                        var transaction = db.transaction($config.store, 'readwrite');
                        transaction.objectStore($config.store).put(reader.result, file.key);
                        typeof callback === 'function' && callback(file.key, isLast);
                        DEBUG && console.log("push: File with key=" + file.key + " has been saved to IDB.");
                    });
                });
                reader.readAsBinaryString(_this.queue[i]);
            })(_this.queue[i], i === _this.queue.length - 1);
        }
    };

    this.get = (key, callback) => {
        open().then((db) => {
            var transaction = db.transaction($config.store, 'readonly');
            var request = transaction.objectStore($config.store).get(key);
            request.onsuccess = () => {
                callback(request.result);
                DEBUG && console.log("get: File with key=" + key + " has been recieved from IDB.");
            };
        });
    };

    this.info = (key) => {
        return _this.queue[_this.keys.indexOf(key)];
    };

    this.getKeys = (callback) => {
        open().then((db) => {
            var transaction = db.transaction($config.store, 'readonly');
            var request = transaction.objectStore($config.store).getAllKeys();
            request.onsuccess = () => {
                DEBUG && console.log("getKeys: ", request.result);
                callback(request.result);
            };
        });
    };

    this.pull = (key, callback) => {
        open().then((db) => {
            var transaction = db.transaction($config.store, 'readwrite');
            var request = transaction.objectStore($config.store).delete(key);
            request.onsuccess = () => {
                DEBUG && console.log("pull: ", key + " has been deleted.", typeof callback);
                typeof callback === 'function' && callback();
            };
        });
    };

    this.clear = (callback) => {
        _this.queue = [];
        _this.keys = [];
        _this.getKeys((keys) => {
            if (keys.length === 0) {
                typeof callback === 'function' && callback();
            } else {
                for (let i = 0; i < keys.length; i++) {
                    let last = (i === keys.length - 1);
                    (function(key, cb){
                        _this.pull(keys[i], cb);
                    })(keys[i], last ? callback : null);
                }
            }
        });
    };
}
