# FileQueue in JavaScript

Simple lib for storing file input in IndexedDB with Promises (async js)

## Methods

```
FileQueue.add(key, file); // add file to the queue with "key: identifier
FileQueue.push(); // push files content to the IndexedDB
FileQueue.delete(key); // delete key from IndexedDB
FileQueue.clear(); // clear queue and data in IndexedDB
FileQueue.getInfo(key); // get item from queue

@todo:
FileQueue.get(key); //get file from IndexedDB

```

## Usage

1 . create new FileQueue with parameters

```
let queue = new FileQueue({
    db: 'db_name',
    store: 'store_name'
});
```

2 . Get file from user input

```
let file = document.getElementById('input').files[0];
```

3 . Add file to the queue and push to IDB

```
queue.add('key', file); // can add many files
queue.push().then(() => {
    console.log("All files saved to IDB!"); //callback
});
```

4 . Clear queue and IDB

```
queue.clear().then(() => {
    console.log("Cleared!");
});
```

## Todo

Read files from IDB and prepare for ajax upload.