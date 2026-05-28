import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { default as GroupMultiSelectPrompt } from '../../src/prompts/group-multiselect.js';
import { MockReadable } from '../mock-readable.js';
import { MockWritable } from '../mock-writable.js';

describe('GroupMultiSelectPrompt', () => {
	let input: MockReadable;
	let output: MockWritable;

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders render() result', () => {
		const instance = new GroupMultiSelectPrompt({
			input,
			output,
			render: () => 'foo',
			options: {
				group1: [{ value: 'a' }, { value: 'b' }],
			},
		});
		instance.prompt();
		expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
	});

	describe('cursor', () => {
		test('navigates between groups and items', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
					group2: [{ value: 'c' }],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(1);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(2);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(3);
		});

		test('cursor wraps around', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', 'up', { name: 'up' });
			expect(instance.cursor).to.equal(1);
			input.emit('keypress', 'down', { name: 'down' });
			expect(instance.cursor).to.equal(0);
		});
	});

	describe('toggleAll', () => {
		test('selects all leaf items across groups when "a" is pressed', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
					group2: [{ value: 'c' }],
				},
			});
			instance.prompt();

			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual(['a', 'b', 'c']);
		});

		test('deselects all leaf items when all are already selected', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
					group2: [{ value: 'c' }],
				},
				initialValues: ['a', 'b', 'c'],
			});
			instance.prompt();

			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual([]);
		});

		test('selects all leaf items when some are already selected', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
					group2: [{ value: 'c' }],
				},
				initialValues: ['a'],
			});
			instance.prompt();

			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual(['a', 'b', 'c']);
		});

		test('does not include group headers in selection', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }],
				},
			});
			instance.prompt();

			input.emit('keypress', 'a', { name: 'a' });
			expect(instance.value).toEqual(['a']);
			expect(instance.value).not.toContain('group1');
		});
	});

	describe('toggleInvert', () => {
		test('inverts selection of all leaf items when "i" is pressed', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
					group2: [{ value: 'c' }, { value: 'd' }],
				},
				initialValues: ['a', 'c'],
			});
			instance.prompt();

			input.emit('keypress', 'i', { name: 'i' });
			expect(instance.value).toEqual(['b', 'd']);
		});

		test('selects all leaf items when none are selected', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
				},
			});
			instance.prompt();

			input.emit('keypress', 'i', { name: 'i' });
			expect(instance.value).toEqual(['a', 'b']);
		});

		test('deselects all leaf items when all are selected', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
				},
				initialValues: ['a', 'b'],
			});
			instance.prompt();

			input.emit('keypress', 'i', { name: 'i' });
			expect(instance.value).toEqual([]);
		});

		test('does nothing when value is undefined', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }],
				},
			});
			instance.prompt();
			instance.value = undefined as any;

			input.emit('keypress', 'i', { name: 'i' });
			expect(instance.value).toBeUndefined();
		});
	});

	describe('toggleValue', () => {
		test('toggles individual leaf item with space', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
				},
			});
			instance.prompt();

			input.emit('keypress', 'down', { name: 'down' });
			input.emit('keypress', ' ', { name: 'space' });
			expect(instance.value).toEqual(['a']);
		});

		test('toggles entire group when cursor is on group header', () => {
			const instance = new GroupMultiSelectPrompt({
				input,
				output,
				render: () => 'foo',
				options: {
					group1: [{ value: 'a' }, { value: 'b' }],
				},
			});
			instance.prompt();

			expect(instance.cursor).to.equal(0);
			input.emit('keypress', ' ', { name: 'space' });
			expect(instance.value).toEqual(['a', 'b']);
		});
	});
});
