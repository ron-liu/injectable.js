import {buildAndAddService, getService, clear} from '../index'
import {extractGraphql} from '../../graphqlize/inject'
import {gqlToSchema} from '../../graphqlize/schema'
import { makeExecutableSchema } from 'graphql-tools';
import {graphql} from 'graphql'

describe('build and addService', () => {
	const add = ({}, input) => {
		console.log('in add', input)
		return input.a + input.b
	}
	const divide = ({}, {a, b}) => a / b
	const average = ({add, divide}, {a,b}) => {
		console.log('xxxxx', a,b, add({a,b}))
		console.log('xxxxx', a,b)
		const sum = add({a,b})
		return divide({a: sum ,b:2})
	}
	
	beforeEach(() => {
		clear()
		buildAndAddService({name: 'add', func: add})
		buildAndAddService({name: 'divide', func: divide})
		buildAndAddService({
			name: 'average',
			option: {
				inject: ['add', 'divide'],
				exposeToGraphql: {
					kind: 'query',
					args: {
						a: 'Int',
						b: 'Int'
					},
					returns: 'Int'
				}
			},
			func: average
		})
	})
	
	it('should work', async () => {
		const {gql, resolvers} = extractGraphql('average', average, getService('average'))
		const schema = makeExecutableSchema({typeDefs: gqlToSchema(gql), resolvers})
		const {data: {average:ret1}} = await graphql(
			schema,
			`query average($a:Int, $b:Int){average(a:$a, b:$b)}`,
			null, null,
			{a:3, b:7}
		)
		expect(ret1).to.eql(5)
	})
	
})