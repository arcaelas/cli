import fs from "node:fs";
import shell from "shelljs";
import path from "node:path";
import Command from "@arcaelas/command";
import inquirer from "inquirer";
import { copy } from "../..";

export default new Command({
    arguments: {},
    async action() {
        const answers = await inquirer.prompt([
            {
                name: "type",
                type: "list",
                message: `What do you want to create?`,
                choices: ['module', 'project'],
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
        const source = path.join(__dirname, 'template')
        if (fs.existsSync(target))
            fs.rmSync(target, { recursive: true })
        await copy(source, target, (content: any, { filename }) => {
            switch (filename) {
                case 'package.json':
                    content = JSON.parse(content)
                    content.name = answers.name
                    if (answers.type === "module")
                        content.type ??= "module"
                    content = JSON.stringify(content, null, 2)
                    break
                case 'tsconfig.json':
                    return null
            }
            return content
        })
        shell.cd(target)
        shell.exec('npx tsc --init --target ESNext --module Node16 --moduleResolution node')
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