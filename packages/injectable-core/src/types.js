// @flow

import type {Fn1,CurriedFn2, Fn2, Fn0 } from './basic-types'
export type InjectableOption = {[id:string]: mixed}

export type Injects = {[id:string]: mixed}
export type Args = {[id:string]: mixed}
export type Return = mixed

export type RawBizFunc = CurriedFn2<Injects, Args, Return>
export type InjectedFunc = Fn1<Args, Return> | Return

export type Next = Fn2<Injects, RawBizFunc, InjectedFunc>
export type Middleware = Fn2<Next, Injects, RawBizFunc, InjectedFunc>
export type Plugin = {
	services: {[id:string]: RawBizFunc},
	middlewares: [Middleware]
}

export type CreateCoreOption = {
	plugins: [Plugin],
}

export type BuildAndAddServiceOption = {
	name: string,
	option: InjectableOption,
	func: RawBizFunc
}

export type AddService = CurriedFn2<string, RawBizFunc, void>
export type GetService = Fn1<string, InjectedFunc>
export type ReplaceService = CurriedFn2<string, RawBizFunc, Fn0<void>>
export type RemoveService = Fn1<string, void>
export type BatchAddService = Fn1<string, void>
export type BuildAndAddService = Fn1<BuildAndAddServiceOption, void>
export type InstallPlugin = Fn1<Plugin, void>

export type Core = {
	getService: GetService,
	addService: AddService,
	replaceService: ReplaceService,
	batchAddService: BatchAddService,
	removeService: RemoveService,
	buildAndAddService: BuildAndAddService
}

type Pattern = {
	pattern: string,
	ignores: Array<string>
}