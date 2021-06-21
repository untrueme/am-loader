import fg from "fast-glob";
import path from "path";
import fs from "fs/promises";

let sorted = [];
const modulePath = `${process.cwd().replace(/\\/g, '/')}/node_modules/`;
const resourceSearchOptionsDefaults = {
    modules: false
};


async function loadModules() {
    const metas = await fg('@*/*/am-meta.js', {
        cwd: path.join(process.cwd(), 'node_modules').replace(/\\/g, '/'),
        followSymlinkedDirectories: true
    });

    const modules = [];

    for (const item of metas) {
        let name = item.split('/');
        name.pop();
        name = name.join('/');
        const packageJson = JSON.parse(await fs.readFile(path.join(process.cwd(), 'node_modules', name, 'package.json').replace(/\\/g, '/')));
        const meta = await import(item);

        modules.push({
            name: packageJson.name,
            version: packageJson.version,
            dirname: path.join(process.cwd(), 'node_modules', name),
            meta: meta
        })
    }

    sorted = [];
    const modulesNames = modules.map(x => x.name);
    function sortModules() {
        let isSpliced = false;
        const copyAmModules = [...modules];
        for (const mod of copyAmModules) {
            const befores = modules.filter(x => x.meta && x.meta.require
                && (x.meta.require.before === mod.name || (Array.isArray(x.meta.require.before) && x.meta.require.before.includes(mod.name))));
            if (befores.length > 0) {
                return;
            }
            if (mod.meta && mod.meta.require && mod.meta.require.after) {
                let { after } = mod.meta.require;
                if (!Array.isArray(after)) after = [after];
                // проверка, что все модули после, которых должен быть текущий уже в списке отсортированных
                // либо неподключен
                if (after.every(z => { return (sorted.findIndex(x => x.name === z) !== -1) || (!modulesNames.includes(z)) })) {
                    sorted.push(mod);
                    modules.splice(modules.indexOf(mod), 1);
                    isSpliced = true;
                }
            } else if (!sorted.find(x => x.name === mod.name)) {
                sorted.push(mod);
                modules.splice(modules.indexOf(mod), 1);
                isSpliced = true;
            }
        }
        return isSpliced;
    }

    sortModules();
    while (modules.length !== 0) {
        const isSpliced = sortModules();
        if (!isSpliced) {
            throw new Error(`Не удалось выстроить модули в порядке зависимостей для инициализации. Возможна циклическая зависимость в модулях: ${modules.map(x => x.name).join('; ')}`);
        }
    }

    return sorted;
}

async function findResources(path, options) {
    options = Object.assign({}, resourceSearchOptionsDefaults, options);
    let resources = [];

    async function handler(path) {
        const files = await fg(path, {
            onlyDirectories: false,
            markDirectories: true,
            onlyFiles: true
        });

        if (!files) { return []; }
        const res = [];
        for (let i = 0, n = files.length; i < n; i++) {
            const filepath = files[i];
            res.push(filepath);
        }
        return res;
    }
    const modules = options.modules || sorted.map(ext => ext.name);
    for (let i = 0, c = modules.length; i < c; i++) {
        const module = modules[i];
        const searchPath = `${modulePath + module}/${path}`.replace('//', '/');

        const moduleFiles = await handler(searchPath);
        if (moduleFiles && moduleFiles.length > 0) {
            resources.push(...moduleFiles);
        }
    }

    return resources;
}

export {
    loadModules,
    findResources
};