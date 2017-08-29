import {injectable, createCore} from '../'
let core
beforeEach(()=> {
	core = createCore()
	core.buildAndAddService({
		name: 'add',
		option: {},
		func: ({}, {a, b}) => a + b
	})
	core.buildAndAddService({
		name: 'average',
		option: {
			injects: ['add']
		},
		func: ({add}, {a,b}) => {
			const sum = add({a,b})
			return sum / 2
		}
	})
})

it('replace should work', () =>{
	core.replaceService('add',
		injectable()(
			({}, {a, b}) => a * b
		)
	)
	expect(core.getService('add')({a:2, b:3})).toEqual(6)
})

it('recover after replace should work', () =>{
	expect(core.getService('add')({a:2, b:3})).toEqual(5)
	const recover = core.replaceService('add',
		injectable()(
			({}, {a, b}) => a * b
		)
	)
	expect(core.getService('add')({a:2, b:3})).toEqual(6)
	recover()
	expect(core.getService('add')({a:2, b:3})).toEqual(5)
})

it('recover after replace for sub-services should work', () =>{
	expect(core.getService('average')({a:2, b:3})).toEqual(2.5)
	const recover = core.replaceService('add',
		injectable()(
			({}, {a, b}) => a * b
		)
	)
	expect(core.getService('average')({a:2, b:3})).toEqual(3)
	
	recover()
	expect(core.getService('average')({a:2, b:3})).toEqual(2.5)
})