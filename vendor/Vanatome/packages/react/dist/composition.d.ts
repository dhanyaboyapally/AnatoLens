import type { VanatomeAtlas, VanatomeAtlasComposition } from "./types.js";
export declare function composeVanatomeAtlases(sources: readonly VanatomeAtlas[]): VanatomeAtlasComposition;
export declare function resolveVanatomeAtlasSources({ atlas, atlases, }: Pick<VanatomeViewerPropsSource, "atlas" | "atlases">): VanatomeAtlasComposition;
type VanatomeViewerPropsSource = {
    atlas?: VanatomeAtlas;
    atlases?: readonly VanatomeAtlas[];
};
export {};
//# sourceMappingURL=composition.d.ts.map