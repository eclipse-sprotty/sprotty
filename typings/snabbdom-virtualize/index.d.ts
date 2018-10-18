declare module "snabbdom-virtualize" {

    import { VNode } from "snabbdom/vnode";
    import { Hooks } from "snabbdom/hooks";

    interface Options {
        context: Document,
        hooks: Hooks
    }

    export default function virtualize(n: Element | string, options?: Options): VNode;

}
