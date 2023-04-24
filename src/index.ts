#!node
import "colors"
import fs from "node:fs"
import path from "node:path"

const scripts = fs.readdirSync(
    path.join(__dirname, 'scripts')
)
const [command, ...args] = process.argv.slice(
    process.argv.indexOf(__filename) + 1
)

if (!scripts.includes(command)) {
    console.log("Arcaelas CLI".underline.green)
    console.log("   arcaela [command] [arguments?] --help?")
    console.log("%s is not a valid command", command.red.bold)
    console.log("commands:")
    console.log("        %s", scripts.join(" "))
    process.exit()
}

import(
    path.resolve(__dirname, 'scripts', command)
).then(({ default: script }) => script.exec(args))

