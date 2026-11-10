'use strict';
/**
 * Local harness for Aura bundles: evaluates the real controller/helper files in a
 * fresh VM context with a stand-in $A, so specs exercise shipped code without an org.
 * In-org runs use LTS instead (lts-tests/). Files are read through calhack/lib/repoFs,
 * so CALHACK_OVERLAY swaps in seeded or "agent complied" versions.
 */
const vm = require('vm');
const repoFs = require('../../../calhack/lib/repoFs');

function makeA() {
    const queue = [];
    const A = {
        queue,
        getCallbackCalls: 0,
        enqueueAction(action) {
            queue.push(action);
        },
        getCallback(fn) {
            A.getCallbackCalls += 1;
            return function wrapped() {
                return fn.apply(this, arguments);
            };
        }
    };
    return A;
}

function makeAction(name) {
    const action = {
        name,
        params: undefined,
        callback: null,
        scope: null,
        setParams(p) {
            action.params = p;
        },
        getParams() {
            return action.params;
        },
        setCallback(scope, cb) {
            action.scope = scope;
            action.callback = cb;
        },
        setStorable() {},
        /** Simulate the server reply. */
        respond(state, value, errors) {
            const response = {
                getState: () => state,
                getReturnValue: () => value,
                getError: () => errors || []
            };
            action.callback.call(action.scope, response);
        }
    };
    return action;
}

function makeComponent(attrs) {
    const values = Object.assign({}, attrs);
    const sets = [];
    const actions = [];
    return {
        values,
        sets,
        actions,
        get(expr) {
            if (expr.startsWith('c.')) {
                const a = makeAction(expr.slice(2));
                actions.push(a);
                return a;
            }
            return values[expr.replace(/^v\./, '')];
        },
        set(expr, value) {
            const key = expr.replace(/^v\./, '');
            sets.push([key, value]);
            values[key] = value;
        },
        isValid() {
            return true;
        }
    };
}

function bundlePath(bundle, part) {
    return `force-app/main/default/aura/${bundle}/${bundle}${part}`;
}

/** Loads controller and helper of an Aura bundle into a new context. */
function load(bundle) {
    const A = makeA();
    const timers = [];
    const context = vm.createContext({
        $A: A,
        Promise,
        window: { setTimeout: (fn, ms) => timers.push({ fn, ms }) && timers.length },
        console
    });
    const evalPart = (part) => {
        const rel = bundlePath(bundle, part);
        return repoFs.exists(rel) ? vm.runInContext(`(${repoFs.read(rel)}\n)`, context, { filename: rel }) : undefined;
    };
    return {
        A,
        timers,
        controller: evalPart('Controller.js'),
        helper: evalPart('Helper.js'),
        markup: () => repoFs.read(bundlePath(bundle, '.cmp')),
        design: () => (repoFs.exists(bundlePath(bundle, '.design')) ? repoFs.read(bundlePath(bundle, '.design')) : '')
    };
}

global.CalhkAura = { load, makeComponent, makeAction, repoFs, cases: require('../../../calhack/lib/cases') };
