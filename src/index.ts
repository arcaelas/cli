#!node
import "colors"
import fs, { existsSync } from "node:fs"
import path, { join, resolve } from "node:path"
import Command from "@arcaelas/command"
import { Noop } from "@arcaelas/utils";

type CopyHandler = Noop<[content: string, options: { source: string, target: string, filename: string }], string>
export async function copy(source: string, target: string, handler?: CopyHandler) {
    const SKIP_FILES = ['node_modules'];
    const stats = fs.statSync(source)
    if (stats.isDirectory()) {
        fs.mkdirSync(target, { recursive: true })
        for (const file of fs.readdirSync(source)) {
            if (SKIP_FILES.includes(file))
                continue
            await copy(
                path.join(source, file),
                path.join(target, file),
                handler,
            )
        }
    }
    else if (stats.isFile()) {
        handler = typeof handler !== 'function' ? a => a : handler
        const content = await handler(fs.readFileSync(source, 'utf-8'), {
            filename: path.basename(source),
            source,
            target,
        })
        if (content !== null)
            fs.writeFileSync(target, content, 'utf8');
    }
}

const paths = {
    cwd: process.cwd(),
    scripts: join(__dirname, 'scripts'),
    sources: join(__dirname, 'scripts'),
}

const scripts = existsSync(paths.scripts) ? fs.readdirSync(paths.scripts) : []
const [script, ...args] = process.argv.slice(
    process.argv.indexOf(__filename) + 1
)

new Command({
    prompts: {
        name: { type: "input" },
        arguments: { type: "rawlist" }
    },
    async action(options) {
        if (!scripts.includes(options.name)) {
            console.log("Arcaelas CLI".underline.green)
            console.log("\"%s\" is not a valid command", options.name.red.bold)
            console.log("arcaela [command] [arguments?] --help?")
            console.log("commands:")
            console.log("        %s", scripts.join(" "))
            process.exit(404)
        }
        try {
            const module = require(resolve(paths.scripts, options.name))
            return await module.default.exec(...options.arguments)
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
    },
}).exec({
    name: script,
    arguments: args,
})