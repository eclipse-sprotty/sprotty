declare module "snabbdom-virtualize/strings" {

    import { VNode } from "snabbdom/vnode";
    import { Hooks } from "snabbdom/hooks";

    interface Options {
        context: Document,
        hooks: Hooks
    }

    export default function virtualize(s: string, options?: Options): VNode;

}
