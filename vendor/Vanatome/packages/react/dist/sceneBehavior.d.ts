import type { VanatomeIsolationState, VanatomeStructure } from "./types.js";
export type VanatomeVisibility = {
    visible: ReadonlySet<string>;
    hidden: ReadonlySet<string>;
    context: ReadonlySet<string>;
};
export declare function createStructureIndex(structures: readonly VanatomeStructure[]): ReadonlyMap<string, VanatomeStructure>;
export declare function getRelatedStructureIds(structures: readonly VanatomeStructure[], rootId: string): Set<string>;
export declare function resolveStructureVisibility(structures: readonly VanatomeStructure[], options: {
    visibleLayers?: readonly string[];
    isolatedId?: string | null;
    isolation?: VanatomeIsolationState | null;
    hiddenIds?: readonly string[];
    alwaysVisibleIds?: readonly string[];
}): VanatomeVisibility;
export declare function isStructureSelectable(structure: VanatomeStructure | undefined, visibleIds: ReadonlySet<string>): boolean;
export declare function calculateFocusDistance(options: {
    radius: number;
    verticalFovDegrees: number;
    aspect: number;
    padding: number;
    minimumDistance: number;
    minDistance: number;
    maxDistance: number;
}): number;
//# sourceMappingURL=sceneBehavior.d.ts.map