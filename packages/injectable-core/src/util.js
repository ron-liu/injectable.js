// @flow

import type {Fn1,CurriedFn2} from './basic-types'
import glob from 'glob'
import {merge, pick, curry} from 'ramda'
import type {Args, InjectedFunc} from "./types";

type Pattern = {
	pattern: string,
	ignores: Array<string>
}

export const loadFiles : Fn1<Pattern, Array<string>>
	= ({pattern, ignores = [ '**/node_modules/**' ]}) =>
	new Promise((res, rej) => glob(pattern, {ignore: ignores}, (err, files) => {
		if (err) {
			rej(err)
		}
		else {
			res(files)
		}
	}))

export const then : CurriedFn2<Fn1<any, any>, Promise<any>> = curry((fn, promise) => {
	return promise.then(fn)
})

type PassDown = CurriedFn2<Args, InjectedFunc, InjectedFunc>
export const genPassDown : Fn1<string, PassDown>
	= name =>　curry((argsFromUpService, injectedService) =>
	args =>
		injectedService(merge(args, pick([name], argsFromUpService)))
)
