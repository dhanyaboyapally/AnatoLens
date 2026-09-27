export function createStructureIndex(structures) {
    return new Map(structures.map((structure) => [structure.id, structure]));
}
export function getRelatedStructureIds(structures, rootId) {
    const childrenByParent = new Map();
    for (const structure of structures) {
        if (!structure.parentId)
            continue;
        const children = childrenByParent.get(structure.parentId) ?? [];
        children.push(structure.id);
        childrenByParent.set(structure.parentId, children);
    }
    const related = new Set();
    const pending = [rootId];
    while (pending.length) {
        const id = pending.pop();
        if (!id || related.has(id))
            continue;
        related.add(id);
        pending.push(...(childrenByParent.get(id) ?? []));
    }
    return related;
}
export function resolveStructureVisibility(structures, options) {
    const layerSet = options.visibleLayers?.length
        ? new Set(options.visibleLayers)
        : null;
    const isolation = options.isolation ??
        (options.isolatedId
            ? { id: options.isolatedId, mode: "selected" }
            : null);
    const structuresById = createStructureIndex(structures);
    const isolationRootId = isolation?.mode === "selected"
        ? isolation.id
        : isolation
            ? structuresById.get(isolation.id)?.parentId ?? isolation.id
            : null;
    const isolated = isolationRootId
        ? getRelatedStructureIds(structures, isolationRootId)
        : null;
    const selected = isolation
        ? getRelatedStructureIds(structures, isolation.id)
        : null;
    const alwaysVisible = new Set(options.alwaysVisibleIds ?? []);
    const hidden = new Set();
    const context = new Set();
    for (const id of options.hiddenIds ?? []) {
        for (const relatedId of getRelatedStructureIds(structures, id)) {
            hidden.add(relatedId);
        }
    }
    const visible = new Set();
    for (const structure of structures) {
        const withinIsolation = !isolated || isolated.has(structure.id);
        const passesLayer = alwaysVisible.has(structure.id) ||
            !layerSet ||
            layerSet.has(structure.layer);
        if (passesLayer &&
            withinIsolation &&
            !hidden.has(structure.id)) {
            visible.add(structure.id);
            if (isolation?.mode === "parent-context" &&
                !selected?.has(structure.id)) {
                context.add(structure.id);
            }
        }
    }
    return { visible, hidden, context };
}
export function isStructureSelectable(structure, visibleIds) {
    return Boolean(structure &&
        structure.selectable !== false &&
        visibleIds.has(structure.id));
}
export function calculateFocusDistance(options) {
    const verticalFov = (options.verticalFovDegrees * Math.PI) / 180;
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(0.01, options.aspect));
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const fittedDistance = (Math.max(0, options.radius) /
        Math.max(0.01, Math.sin(limitingFov / 2))) *
        Math.max(1, options.padding);
    return Math.min(options.maxDistance, Math.max(options.minDistance, options.minimumDistance, fittedDistance));
}
//# sourceMappingURL=sceneBehavior.js.map