import path from "path";
import fs from "fs/promises";

import { loadModules, findResources } from "./libs/metaLoader.js"
import { getPath } from "./libs/utils.js"

const configPath = path.join(process.cwd(), 'config.json').replace(/\\/g, '/');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

(async () => {
    const modules = await loadModules();

    for (let i = 0, n = modules.length; i < n; i++) {
        await import(modules[i].name);
    }
})();

function getConfig(name, defaultValue) {
    const configOption = getPath(config, name);
    if (configOption) {
        return configOption;
    } else if (defaultValue) {
        return defaultValue;
    }

    console.log(`Option with given path ${name} is not defined`);
}


export {
    getConfig,
    config,
    findResources
}

