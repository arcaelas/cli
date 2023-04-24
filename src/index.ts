#!node
import "colors"
import fs from "node:fs"
import path from "node:path"
import Command from "@arcaelas/command"

const scripts = fs.readdirSync(
    path.join(__dirname, 'scripts')
)
const [script, ...args] = process.argv.slice(
    process.argv.indexOf(__filename) + 1
)

new Command({
    arguments: {
        name(token: string) {
            if (!scripts.includes(token)) {
                console.log("Arcaelas CLI".underline.green)
                console.log("   arcaela [command] [arguments?] --help?")
                console.log("%s is not a valid command", script.red.bold)
                console.log("commands:")
                console.log("        %s", scripts.join(" "))
                process.exit()
            }
            return token
        },
        arguments: Array,
    },
    async action(options, argv) {
        const module = await import(
            path.resolve(__dirname, 'scripts', options.name)
        )
        return module.default(options.arguments, argv)
    },
}).exec({
    name: script,
    arguments: args,
})