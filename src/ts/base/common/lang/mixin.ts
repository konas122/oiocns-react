/* eslint-disable no-constant-condition */
/* eslint-disable no-redeclare */
/* eslint-disable prettier/prettier */
/* prettier-ignore */

export type Class<T = any> = abstract new(...args: any[]) => T;
export type Constructor<T> = new(...args: any[]) => T;
export type PlainClass<T> = new () => T;


function getRootPrototype(obj: object) {
  let proto = obj;
  while (true) {
    let p = Reflect.getPrototypeOf(proto);
    if (p == null) {
      break;
    }
    if (Reflect.getPrototypeOf(p) == null) {
      break;
    }
    proto = p
  }
  return proto;
}


export function mixins<T extends Class>(baseClass: T): T;
export function mixins<T extends Class, A>(baseClass: T, CtorA: PlainClass<A>): T & Class<A>;
export function mixins<T extends Class, A, B>(baseClass: T, CtorA: PlainClass<A>, CtorB: PlainClass<B>): T & Class<A & B>;
export function mixins<T extends Class, A, B, C>(baseClass: T, CtorA: PlainClass<A>, CtorB: PlainClass<B>, CtorC: PlainClass<C>): T & Class<A & B & C>;
export function mixins<T extends Class, A, B, C, D>(baseClass: T, CtorA: PlainClass<A>, CtorB: PlainClass<B>, CtorC: PlainClass<C>, CtorD: PlainClass<D>): T & Class<A & B & C & D>;


export function mixins(baseClass: Class<any>,...constructors: PlainClass<any>[]): Class<any> {
  return class Mixed extends baseClass {
    constructor(...args: any[]) {
      super(...args);

      let obj = getRootPrototype(this);
      for (const ctor of constructors) {
        let instance = new ctor();
        Reflect.setPrototypeOf(obj, instance);
        obj = getRootPrototype(instance);
      }
    }
  }
}