import fs from "node:fs";
import path from "node:path";
import Command from "@arcaelas/command";
import readline from "node:readline/promises"

async function prompt(question: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    console.log(question.trim().replace(/\:$/g, "") + ':')
    return rl.question("> ")
}

function copy(source: string, target: string) {
    const SKIP_FILES = ['node_modules'];
    const stats = fs.statSync(source)
    if (stats.isFile()) {
        let content = fs.readFileSync(source, 'utf-8') as any
        if (path.basename(source) === 'package.json') {
            const name = path.basename(
                path.dirname(target)
            )
            content = JSON.parse(content)
            content = JSON.stringify({ ...content, name }, null, 2)
        }
        fs.writeFileSync(target, content, 'utf8');
    } else if (stats.isDirectory()) {
        fs.mkdirSync(target, { recursive: true })
        for (const file of fs.readdirSync(source)) {
            if (SKIP_FILES.includes(file))
                continue
            copy(
                path.join(source, file),
                path.join(target, file),
            )
        }
    }
}

export default new Command({
    arguments: {
        name: String,
        type: String as unknown as 'module' | 'project',
    },
    async action(options) {
        options.name ||= await prompt("Where you want to create?") as string
        options.type ||= await prompt("What do you want? \"project\" or \"module\"") as "module" | "project"


        if (!options.name) throw new Error("Name could not be empty")
        if (options.type !== 'project' && options.type !== 'module')
            throw new Error(`Type must be \"module\" or \"project\", received: ${options.type}`)

        const target = path.join(process.cwd(), options.name)
        const source = path.join(__dirname, 'templates', options.type)
        if (fs.existsSync(target))
            fs.rmSync(target, { recursive: true })
        copy(source, target,)
    },
})