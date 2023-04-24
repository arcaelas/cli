import fs from "node:fs";
import shell from "shelljs";
import path from "node:path";
import Command from "@arcaelas/command";
import inquirer from "inquirer";


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
    arguments: {},
    async action() {
        const templates = fs.readdirSync(
            path.join(__dirname, 'templates')
        )
        const answers = await inquirer.prompt([
            {
                name: "type",
                type: "list",
                message: `What do you want to create?`,
                choices: templates,
                validate: input => input.trim() ? true : "Name could not be empty",
            },
            {
                name: "name",
                type: "input",
                default: path.basename(process.cwd()),
                message: a => `What do you want to name yor ${a.type}?`,
                validate: input => input.trim() ? true : "Name could not be empty",
            },
            {
                name: "install",
                type: "confirm",
                message: "Install dependencies after create?",
            },
            {
                name: "packager",
                type: "list",
                when: a => a.install,
                choices: ['npm', 'yarn', 'pnpm'],
            },
        ])
        const target = path.join(process.cwd(), answers.name)
        const source = path.join(__dirname, 'templates', answers.type)
        if (fs.existsSync(target))
            fs.rmSync(target, { recursive: true })
        copy(source, target)
        shell.cd(target)
        switch (answers.packager) {
            case "npm":
                shell.exec("npm ci")
                break
            case "pnpm":
                shell.exec("npx pnpm ci")
                break
            case "yarn":
                shell.exec("npx yarn install --frozen-lockfile")
                break
        }
        process.exit()
    },
})