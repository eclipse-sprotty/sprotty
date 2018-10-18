declare module "snabbdom-virtualize/nodes" {

    import { VNode } from "snabbdom/vnode";
    import { Hooks } from "snabbdom/hooks";

    interface Options {
        context: Document,
        hooks: Hooks
    }

    export default function virtualize(e: Element, options?: Options): VNode;

}
