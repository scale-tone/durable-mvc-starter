"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);
// Root folder where all the statics are copied to
const wwwroot = './ui/build';
// Serves statics for the client UI
function default_1(context) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const lastModifiedTime = (yield fs.promises.stat(mapEntry.fileName)).mtime;
                context.res = {
                    body: yield readFileAsync(mapEntry.fileName),
                    headers: {
                        'Content-Type': mapEntry.contentType,
                        'Last-Modified': lastModifiedTime.toUTCString()
                    }
                };
            }
            else {
                context.res = { status: 404 };
            }
        }
        else {
            // Returning index.html by default, to support client routing
            const indexHtmlPath = `${wwwroot}/index.html`;
            const lastModifiedTime = (yield fs.promises.stat(indexHtmlPath)).mtime;
            context.res = {
                body: yield readFileAsync(indexHtmlPath),
                headers: {
                    'Content-Type': 'text/html; charset=UTF-8',
                    'Last-Modified': lastModifiedTime.toUTCString()
                }
            };
        }
    });
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map