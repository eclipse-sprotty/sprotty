/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/**
 * An iterable that allows filtering, mapping values etc. with a fluent API.
 * Arrays conform to this interface, so an array can be passed at every place where
 * a FluentIterable is expected.
 */
export interface FluentIterable<T> extends Iterable<T> {
    filter(callback: (element: T) => boolean): FluentIterable<T>
    map<T2>(callback: (element: T) => T2): FluentIterable<T2>
    forEach(callback: (element: T, index: number) => void): void
    indexOf(element: any): number
}

/**
 * A helper class that allows to easily create fluent iterables.
 */
export class FluentIterableImpl<S, T> implements FluentIterable<T> {

    constructor(private readonly startFn: () => S,
                private readonly nextFn: (state: S) => IteratorResult<T>) {}

    [Symbol.iterator]() {
        const iterator = {
            state: this.startFn(),
            next: () => this.nextFn(iterator.state),
            [Symbol.iterator]: () => iterator
        };
        return iterator;
    }

    filter(callback: (element: T) => boolean): FluentIterable<T> {
        return filterIterable(this, callback);
    }

    map<T2>(callback: (element: T) => T2): FluentIterable<T2> {
        return mapIterable(this, callback);
    }

    forEach(callback: (element: T, index: number) => void): void {
        const iterator = this[Symbol.iterator]();
        let index = 0;
        let result: IteratorResult<T>;
        do {
            result = iterator.next();
            if (result.value !== undefined)
                callback(result.value, index);
            index++;
        } while (!result.done);
    }

    indexOf(element: any): number {
        const iterator = this[Symbol.iterator]();
        let index = 0;
        let result: IteratorResult<T>;
        do {
            result = iterator.next();
            if (result.value === element)
                return index;
            index++;
        } while (!result.done);
        return -1;
    }
}

/**
 * Converts a FluentIterable into an array. If the input is an array, it is returned unchanged.
 */
export function toArray<T>(input: FluentIterable<T>): T[] {
    if (input.constructor === Array) {
        return input as T[];
    }
    const result: T[] = [];
    input.forEach(element => result.push(element));
    return result;
}

export const DONE_RESULT: IteratorResult<any> = Object.freeze({ done: true, value: undefined });

/**
 * Create a fluent iterable that filters the content of the given iterable or array.
 */
export function filterIterable<T>(input: Iterable<T> | ArrayLike<T>, callback: (element: T) => boolean): FluentIterable<T> {
    return new FluentIterableImpl(
        () => createIterator(input),
        (iterator) => {
            let result: IteratorResult<T>;
            do {
                result = iterator.next();
            } while (!result.done && !callback(result.value));
            return result;
        }
    );
}

/**
 * Create a fluent iterable that maps the content of the given iterable or array.
 */
export function mapIterable<T1, T2>(input: Iterable<T1> | ArrayLike<T1>, callback: (element: T1) => T2): FluentIterable<T2> {
    return new FluentIterableImpl(
        () => createIterator(input),
        (iterator) => {
            const { done, value } = iterator.next();
            if (done)
                return DONE_RESULT;
            else
                return { done: false, value: callback(value) };
        }
    );
}

/**
 * Create an iterator for the given iterable or array.
 */
function createIterator<T>(collection: Iterable<T> | ArrayLike<T>): Iterator<T> {
    const method = (collection as Iterable<T>)[Symbol.iterator];
    if (typeof method === 'function') {
        return method.call(collection);
    }
    const length = (collection as ArrayLike<T>).length;
    if (typeof length === 'number' && length >= 0) {
        return new ArrayIterator(collection as ArrayLike<T>);
    }
    return { next: () => DONE_RESULT };
}

/**
 * Iterator implementation for arrays.
 */
class ArrayIterator<T> implements IterableIterator<T> {
    constructor(private readonly array: ArrayLike<T>) {}

    private index = 0;

    next(): IteratorResult<T> {
        if (this.index < this.array.length)
            return { done: false, value: this.array[this.index++] };
        else
            return DONE_RESULT;
    }

    [Symbol.iterator]() {
        return this;
    }
}
