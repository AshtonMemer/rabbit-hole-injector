import readline from "readline";
import chalk from "chalk";
import JSZip from "jszip";
import * as fs from "fs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!fs.existsSync("rabbit-hole.exe")) {
  console.error(
    "Error: rabbit-hole.exe not found. Ensure this injector is in your Rabbit Hole directory."
  );
  await ask();
  process.exit(1);
}

interface MenuOption {
  description: string;
  action: () => Promise<void> | Promise<never>;
}

const menuOptions: Record<string, MenuOption> = {
  "1": {
    description: "Enable/disable extensions",
    action: async () => {
      let injected = false;
      let extensions = getExtensions();
      while (!injected) {
        menuHeader();

        if (extensions.length === 0) {
          console.log(chalk.gray("No extensions found."));
          await ask();
          console.clear();
          return;
        }

        for (let i = 0; i < extensions.length; i++) {
          let status = extensions[i].enabled
            ? chalk.green("enabled")
            : chalk.red("disabled");

          if (extensions[i].name.toLowerCase() === "interop") {
            status = chalk.gray("required");
          }

          console.log(`[${i + 1}] ${extensions[i].name} (${status})`);
        }

        menuFooter();
        console.log("[X] Inject selected extensions");
        console.log("[Q] Back");
        menuFooter();
        console.log(
          "Enter the number of the extension you want to toggle, and X to inject"
        );
        const choice = (await ask("> ")) as string;

        if (choice.toLowerCase() === "x") {
          const enabledExtensions = extensions.filter((e) => e.enabled);

          if (enabledExtensions.length === 0) {
            console.error("No extensions selected.");
            await ask();
            continue;
          }

          console.log(
            chalk.gray(`Injecting ${enabledExtensions.length} extensions...`)
          );

          // restore original index.html
          fs.unlinkSync("./resources/app/index.html");
          fs.copyFileSync(
            "./resources/app/index_backup.html",
            "./resources/app/index.html"
          );

            const data =
            enabledExtensions
              .filter((e) => !e.isZip)
              .map(
              (e) =>
                '"' +
                "data:text/javascript;," +
                encodeURIComponent(e.data.toString()) +
                '"'
              )
              .join(",") + ",";

          const htmlText = fs.readFileSync(
            "./resources/app/index.html",
            "utf-8"
          );

          const searchString = `(new%20GamepadExtension())%3B%0A%7D)(Scratch)%3B%0A%20%7D)(Scratch)%3B",`;
          const position = htmlText.indexOf(searchString);
          const insertPosition = position + searchString.length;

          const newHtmlText =
            htmlText.slice(0, insertPosition) +
            data +
            htmlText.slice(insertPosition);

          fs.writeFileSync("./resources/app/index.html", newHtmlText);

          // inject asset extensions, aka zip files

          const zipExtensions = enabledExtensions.filter((e) => e.isZip);

          for (const extension of zipExtensions) {
            const zip = new JSZip();
            await zip.loadAsync(extension.data);

            const files = Object.keys(zip.files);

            for (const file of files) {
              const fileData = await zip.file(file)!.async('nodebuffer');
              const fileName = assetNameToId(file.split('.')[0]) + '.' +  file.split('.')[1];

              // first, back up the old file with the same name
              if (fs.existsSync(`./resources/app/assets/${fileName}`)) {
                if (!fs.existsSync(`./resources/app/assets/${fileName}.bak`)) {
                  fs.copyFileSync(
                    `./resources/app/assets/${fileName}`,
                    `./resources/app/assets/${fileName}.bak`
                  );
                }
                fs.writeFileSync(`./resources/app/assets/${fileName}`, fileData);
              } else {
                console.error(`Error: file ${fileName} not found in assets folder.`);
              }
            }
          }

        console.log("Injected extensions!");
        await ask();
        console.clear();
        injected = true;
        return;
        } else if (choice.toLowerCase() === "q") {
          console.clear();
          return;
        }

        const index = parseInt(choice) - 1;

        if (isNaN(index) || index < 0 || index >= extensions.length) {
          console.error("Invalid choice.");
          await ask();
          continue;
        }

        if (extensions[index].name.toLowerCase() === "interop") {
          console.error("Interop is required and cannot be disabled.");
          await ask();
          continue;
        }

        if (extensions[index])
          extensions[index].enabled = !extensions[index].enabled;
      }
    },
  },
  "2": {
    description: "Restore original files",
    action: async () => {
      menuHeader();

      if (!fs.existsSync("./resources/app/index_backup.html")) {
        console.error("Backup not found.");
        await ask();
        console.clear();
        return;
      }

      fs.unlinkSync("./resources/app/index.html");
      fs.copyFileSync(
        "./resources/app/index_backup.html",
        "./resources/app/index.html"
      );

      // find any files within the assets folder that have a .bak extension
      const files = fs.readdirSync("./resources/app/assets");
      for (const file of files) {
        if (file.endsWith(".bak")) {
          const originalFileName = file.substring(0, file.length - 4);
          fs.unlinkSync(`./resources/app/assets/${originalFileName}`);
          fs.copyFileSync(
            `./resources/app/assets/${file}`,
            `./resources/app/assets/${originalFileName}`
          );
          fs.unlinkSync(`./resources/app/assets/${file}`);
        }
      }

      console.log("Restored original files.");
      await ask();
      console.clear();
      return;
    },
  },
  "3": {
    description: "Exit",
    action: async () => {
      process.exit(0);
    },
  },
};

const menuHeader = () => {
  console.clear();
  console.log(chalk.yellow("======================================="));
  console.log(chalk.redBright("Rabbit Hole Injector (v0.1)"));
  console.log(chalk.yellow("======================================="));
};

const menuFooter = () => {
  console.log(chalk.yellow("======================================="));
};

async function displayMenu() {
  menuHeader();
  Object.keys(menuOptions).forEach((key) => {
    console.log(`[${key}] ${menuOptions[key].description}`);
  });
  menuFooter();

  const choice = (await ask("> ")) as string;
  const selectedOption = menuOptions[choice];
  if (selectedOption) {
    await selectedOption.action();
  } else {
    console.error("Invalid choice.");
    await ask();
    console.clear();
  }
}

async function main() {
  if (!fs.existsSync("extensions")) fs.mkdirSync("extensions");
  if (
    !fs.existsSync("./resources") ||
    !fs.existsSync("./resources/app") ||
    !fs.existsSync("./resources/app/index.html")
  ) {
    console.error(
      "Error: resources not found. Ensure this injector is in your Rabbit Hole directory."
    );
    await ask();
    process.exit(1);
  }
  if (!fs.existsSync("./resources/app/index_backup.html")) {
    fs.copyFileSync(
      "./resources/app/index.html",
      "./resources/app/index_backup.html"
    );
  }

  while (true) {
    await displayMenu();
  }
}

function getExtensions() {
  const files = fs
    .readdirSync("extensions")
    .filter((file) => file.endsWith(".js") || file.endsWith(".ts") || file.endsWith('.zip'));
  const extensions: {
    name: string;
    data: Buffer;
    enabled: boolean;
    isZip: boolean;
  }[] = [];

  for (const file of files) {
    const data = fs.readFileSync(`extensions/${file}`);
    extensions.push({
      name: file.substring(0, file.lastIndexOf(".")),
      data,
      enabled: true,
      isZip: file.endsWith('.zip')
    });
  }

  return extensions;
}

const jsonData = fs.readFileSync('./resources/app/assets/project.json', 'utf-8');
let assetMap = new Map();

if (jsonData) {
  const data = JSON.parse(jsonData)["targets"];
  for (const target of data) {
    for (const costume of target['costumes']) {
      const key = `${target['name']}^${costume['name']}`;
      assetMap.set(key, costume['assetId']);
    }
  }
}

function assetNameToId(name: string) {
  const assetName = name
    .replaceAll('~', '//')
    .replaceAll('/'.charCodeAt(0).toString(16), '/')
    .replaceAll('*'.charCodeAt(0).toString(16), '*')
    .replaceAll('?'.charCodeAt(0).toString(16), '?')
    .replaceAll('"'.charCodeAt(0).toString(16), '"')
    .replaceAll('<'.charCodeAt(0).toString(16), '<')
    .replaceAll('>'.charCodeAt(0).toString(16), '>')
    .replaceAll('|'.charCodeAt(0).toString(16), '|')
    .replaceAll(':'.charCodeAt(0).toString(16), ':')
    .replaceAll('\\'.charCodeAt(0).toString(16), '\\');

  return assetMap.get(assetName) || null;
}

async function ask(message: string = "") {
  return new Promise((resolve) => {
    rl.question(message, (a) => {
      resolve(a);
    });
  });
}

main();
