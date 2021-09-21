import * as fs from 'fs';
import { Context } from "@azure/functions"

import serve_statics from '../../serve-statics/index';

const context: Context = {
    invocationId: '',
    executionContext: null,
    bindings: null,
    traceContext: null,
    bindingDefinitions: [],
    log: null,
    done: () => { },
    bindingData: null
}

test('returns index.html by default', async () => {

    context.bindingData = {
        p1: 'some',
        p2: 'path',
        p3: undefined
    };

    await serve_statics(context);
    
    expect(context.res.headers['Content-Type']).toBe('text/html; charset=UTF-8');
    expect(context.res.headers['Last-Modified']).toBeDefined();

    const body = context.res.body.toString() as string;
    expect(body.startsWith('<!doctype html>')).toBeTruthy();
});

test('returns index.html for arbitrary path', async () => {

    context.bindingData = {
        p1: 'static\\..',
        p2: '\\..',
        p3: 'package.json'
    };

    await serve_statics(context);    
    
    expect(context.res.headers['Content-Type']).toBe('text/html; charset=UTF-8');
    expect(context.res.headers['Last-Modified']).toBeDefined();

    const body = context.res.body.toString() as string;
    expect(body.startsWith('<!doctype html>')).toBeTruthy();
});

test('returns some css', async () => {

    const cssFileName = (await fs.promises.readdir('ui/build/static/css'))[0];

    context.bindingData = {
        p1: 'static',
        p2: 'css',
        p3: cssFileName
    };

    await serve_statics(context);    
    
    expect(context.res.headers['Content-Type']).toBe('text/css; charset=utf-8');
    expect(context.res.headers['Last-Modified']).toBeDefined();

    const body = context.res.body.toString() as string;
    expect(body).toBeDefined();
});

test('returns 404 for invalid path', async () => {

    context.bindingData = {
        p1: 'static',
        p2: 'css',
        p3: '..\\..\\manifest.json'
    };
    
    await serve_statics(context);    
    
    expect(context.res.status).toBe(404);
});