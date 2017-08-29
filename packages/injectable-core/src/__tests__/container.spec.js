import {createCore, tag, injectable, inject} from '..'

let core
const createNewCore = () => core = createCore()

beforeEach(createNewCore)

test('basic addService and invoke should work', async () => {
	const signIn = injectable()(({}, {userName, password}) => {
		if (userName === 'ron') return 'xyz'
		else throw new Error('password error')
	})
	
	core.addService('signIn', signIn)
	expect(core.getService('signIn')({userName: 'ron'})).toEqual('xyz')
	expect(() => getService('xxx')).toThrow()
})


test('without injectable, should not allow to addService', () => {
	expect(() => core.addService('xxx', ({}, {a}) => a)).toThrow()
})

test('addService a depend should work', async () => {
	const add = injectable()(({}, {a,b})=> a+b)
	const divide = injectable()(({}, {a,b}) => a/b)

	const average = injectable({
		injects: ['add', 'divide']
	})(
		({add, divide}, {a,b}) => {
			const sum = add({a,b})
			return divide({a: sum ,b:2})
		}
	)

	core.addService('add', add);
	core.addService('divide', divide);
	core.addService('average', average);

	expect(core.getService('average')({a:4, b:2})).toEqual(3)
})

test('batch addService should work', async () => {
	await core.batchAddServices(`${__dirname}/batch-register`)

	expect(core.getService('average')({a:4, b:2})).toEqual(3)
})

test('getService and be injected', async() => {
	const add = injectable()(({}, {a,b})=> a+b)

	const divide = injectable()(({}, {a,b}) => a/b)

	const average = injectable({
		injects: ['getService']
	})(
		({getService}, {a,b}) => {
			const sum = getService({name: 'add'})({a,b})
			return getService({name:'divide'})({a: sum ,b:2})
		}
	)

	core.addService('add', add);
	core.addService('divide', divide);
	core.addService('average', average);

	expect(core.getService('average')({a:4, b:2})).toEqual(3)
})