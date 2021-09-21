import { Context } from "@azure/functions"

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
const readFileAsync = util.promisify(fs.readFile);

// Root folder where all the statics are copied to
const wwwroot = './ui/build';

// Serves statics for the client UI
export default async function (context: Context): Promise<void> {

    // Sanitizing input, just in case
    const p1 = !!context.bindingData.p1 ? path.basename(context.bindingData.p1) : '';
    const p2 = !!context.bindingData.p2 ? path.basename(context.bindingData.p2) : '';
    const p3 = !!context.bindingData.p3 ? path.basename(context.bindingData.p3) : '';

    const fileMap = {
        'static/css': {
            fileName: `${wwwroot}/static/css/${p3}`,
            contentType: 'text/css; charset=utf-8'
        },
        'static/js': {
            fileName: `${wwwroot}/static/js/${p3}`,
            contentType: 'application/javascript; charset=UTF-8'
        },
        'static/media': {
            fileName: `${wwwroot}/static/media/${p3}`,
            contentType: 'image/svg+xml; charset=UTF-8'
        },
        'favicon.ico/undefined': {
            fileName: `${wwwroot}/favicon.ico`,
            contentType: 'image/x-icon'
        },
        'logo192.png/undefined': {
            fileName: `${wwwroot}/logo192.png`,
            contentType: 'image/png'
        },
        'logo512.png/undefined': {
            fileName: `${wwwroot}/logo512.png`,
            contentType: 'image/png'
        }
    };

    const mapEntry = fileMap[`${p1}/${p2}`];

    if (!!mapEntry) {

        if (!!fs.existsSync(mapEntry.fileName)) {

            const lastModifiedTime = (await fs.promises.stat(mapEntry.fileName)).mtime;

            context.res = {
                body: await readFileAsync(mapEntry.fileName),
                headers: {
                    'Content-Type': mapEntry.contentType,
                    'Last-Modified': lastModifiedTime.toUTCString()
                }
            };

        } else {

            context.res = { status: 404 };
        }

    } else {

        // Returning index.html by default, to support client routing

        const indexHtmlPath = `${wwwroot}/index.html`;
        const lastModifiedTime = (await fs.promises.stat(indexHtmlPath)).mtime;

        context.res = {
            body: await readFileAsync(indexHtmlPath),
            headers: {
                'Content-Type': 'text/html; charset=UTF-8',
                'Last-Modified': lastModifiedTime.toUTCString()
            }
        };
    }
};