function setPath(object, path, value, delimiter = '.') {
    path = path.split(delimiter);

    let i;
    for (i = 0; i < path.length - 1; i++) {
        if (!object[path[i]] && path[i + 1]) {
            object[path[i]] = isNaN(path[i + 1]) ? {} : [];
        }
        object = object[path[i]];
    }
    object[path[i]] = value;
}

function getPath(object, path, delimiter = '.') {
    path = path.split(delimiter);
    let i;
    for (i = 0; i < path.length - 1; i++) {
        if (!object[path[i]]) {
            return;
        }
        object = object[path[i]];
    }
    return object[path[i]];
}

export {
    setPath,
    getPath
}