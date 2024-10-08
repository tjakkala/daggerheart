/**
 * Represents a document which can be attached to a Svelte Component
 */
export type SvelteSheet<T> = {
  getData: () => T;
  document: foundry.abstract.Document<any, any>;
};

/**
 * Represents a SvelteComponent which can be created by calling new() on it
 */
export type SvelteComponent = {
  new (): any;
};

/**
 * Injects the provided Svelte Component into the first form in the HTML provided. Uses the sheet provided
 * to provide data and update the component.
 * @param sheet - A sheet instance. Must have access to a foundry document and implement getData()
 * @param svelteComponent - A svelte component to inject
 * @param html - Html node that will house the svelte component
 *
 * @example
 *     // within your sheet class
 *     import YourSheetComponent from "./your-sheet.svelte";
 *
 *     export class YourSheet extends SomeSheet {
 *
 *       async _injectHTML(html: JQuery) {
 *         await super._injectHTML(html);
 *         injectSvelteComponent(this, FormApp, html);
 *       }
 *
 *       async _replaceHTML(element: JQuery, html: JQuery) {
 *         await super._injectHTML(html);
 *         injectSvelteComponent(this, FormApp, html);
 *       }
 *     }
 *
 *     // within your svelte component
 *     <script lang="ts">
 *       // very important that you have a single entry named "props"
 *       export let props: any
 *       // set up data with "$:" so that it will respond to updates
 *       $: data = props.data
 *       const update = props.update
 *       // if you pick properties off of data and want those to update too, make sure to again use "$:"
 *       $: myData = data.myData
 *       $: otherStuff = data.otherStuff
 *     </script>
 */
export function injectSvelteComponent<T>(
  sheet: SvelteSheet<T>,
  svelteComponent: SvelteComponent,
  html: JQuery,
) {
  // Placeholder reference to the Svelte Component
  let app: any;
  let props: any = {
    data: sheet.getData(),
  };
  // Create a callback which the component can call in order to make changes the document and then be notified once those changes are done
  const updateCallback = async (property: string, value: any) => {
    // update document
    await sheet.document.update({ [property]: value }, { render: false });
    // update data on sheetData
    props.data = sheet.getData();
    // Tell svelte to check its props again so that it will realize that "data" was externally updated by foundry
    // @ts-ignore
    app.$$.update();
  };
  props.update = updateCallback;
  const target = html.find("form")[0];
  // @ts-ignore
  app = new svelteComponent({
    target: target,
    props: {
      props: props,
    },
  });
  return app;
}
